<?php
include("conexion_db.php");

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    responder(false, "Método no permitido (usa POST).");
}

$nombre   = trim($_POST['nombre']   ?? '');
$correo   = trim($_POST['correo']   ?? '');
$contraseña    = $_POST['contraseña']         ?? '';
$telefono = trim($_POST['telefono'] ?? '');   // opcional

if ($nombre === '' || $correo === '' || $contraseña === '') {
    responder(false, "Completa todos los campos requeridos.");
}
if (!filter_var($correo, FILTER_VALIDATE_EMAIL)) {
    responder(false, "El correo no es válido.");
}

// ¿Correo ya registrado?
$check = $conexion->prepare("SELECT id FROM usuarios WHERE correo = ?");
if (!$check) {
    responder(false, "Error SQL (SELECT): " . $conexion->error);
}
$check->bind_param("s", $correo);
$check->execute();
$check->store_result();
if ($check->num_rows > 0) {
    $check->close();
    responder(false, "Este correo ya se encuentra registrado.");
}
$check->close();

$contraseña_segura = password_hash($contraseña, PASSWORD_BCRYPT);

$stmt = $conexion->prepare("INSERT INTO usuarios (nombre, correo, `contraseña`, telefono) VALUES (?, ?, ?, ?)");
if (!$stmt) {
    responder(false, "Error SQL (INSERT): " . $conexion->error);
}
$stmt->bind_param("ssss", $nombre, $correo, $contraseña_segura, $telefono);

if ($stmt->execute()) {
    responder(true, "¡Registro exitoso! Sesión iniciada.", [
        'id'     => $conexion->insert_id,
        'nombre' => $nombre,
        'email'  => $correo
    ]);
} else {
    responder(false, "Error al registrar: " . $stmt->error);
}