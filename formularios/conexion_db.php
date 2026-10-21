<?php
// Cabeceras: respuesta JSON y permiso para que la página (aunque esté en otro puerto o abierta como archivo) pueda llamar a este PHP
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

// Ocultar errores de PHP en pantalla (rompen el JSON); se devuelven como mensaje
ini_set('display_errors', 0);
error_reporting(E_ALL);
mysqli_report(MYSQLI_REPORT_OFF);

function responder($ok, $mensaje, $usuario = null) {
    echo json_encode(['ok' => $ok, 'mensaje' => $mensaje, 'usuario' => $usuario], JSON_UNESCAPED_UNICODE);
    exit;
}

$host          = "localhost";
$usuario_db    = "root";
$password_db   = "";
$base_de_datos = "blackclothes";

$conexion = @new mysqli($host, $usuario_db, $password_db, $base_de_datos);

if ($conexion->connect_error) {
    responder(false, "Error de conexión a la base de datos: " . $conexion->connect_error);
}

$conexion->set_charset("utf8mb4");
