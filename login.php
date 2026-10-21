<?php
include("conexion_db.php");

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    responder(false, "Método no permitido (usa POST).");
}

$correo = trim($_POST['correo'] ?? '');
$contraseña  = $_POST['contraseña'] ?? '';

if ($correo === '' || $contraseña === '') {
    responder(false, "Completa todos los campos requeridos.");
}

$stmt = $conexion->prepare("SELECT id, nombre, correo, `contraseña`, rol FROM usuarios WHERE correo = ?");
if (!$stmt) {
    responder(false, "Error SQL: " . $conexion->error);
}
$stmt->bind_param("s", $correo);
$stmt->execute();
$fila = $stmt->get_result()->fetch_assoc();

if (!$fila) {
    responder(false, "El correo electrónico no está registrado.");
}
if (!password_verify($contraseña, $fila['contraseña'])) {
    responder(false, "Contraseña incorrecta. Inténtalo de nuevo.");
}

responder(true, "¡Inicio de sesión correcto!", [
    'id'     => $fila['id'],
    'nombre' => $fila['nombre'],
    'email'  => $fila['correo'],
    'rol'    => $fila['rol']
]);