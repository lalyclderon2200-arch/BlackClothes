<?php
include("conexion_db.php");
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

// ============================================================
//  CONFIGURACIÓN
// ============================================================
const CLAVE_ADMIN = 'blackclothes2026';   // <-- CÁMBIALA por una clave tuya
const TABLAS_PERMITIDAS = ['pedidos', 'producto', 'promociones', 'usuarios'];
// Carpeta donde se guardan las imágenes subidas y la ruta que se guarda en la base de datos.
// Si tus páginas están en otra carpeta, pon aquí la ruta real de tu carpeta img, por ejemplo:
// const CARPETA_IMAGENES = 'C:/xampp/htdocs/blackclothes/img/';
const CARPETA_IMAGENES = __DIR__ . '/img/';
const RUTA_IMAGENES    = 'img/';
const COLUMNAS_CONTRASENA = ['contraseña', 'contrasena', 'password', 'clave'];

function salida($datos) {
    echo json_encode($datos, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
    exit;
}
function fallo($mensaje, $codigo = null) {
    salida(['ok' => false, 'mensaje' => $mensaje, 'codigo' => $codigo]);
}
function esContrasena($columna) {
    return in_array(mb_strtolower($columna), COLUMNAS_CONTRASENA, true);
}
function esTexto($tipo) {
    return preg_match('/char|text|enum|set|json/i', $tipo) === 1;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    fallo("Método no permitido (usa POST).");
}

// 1. Clave de administrador
if (!hash_equals(CLAVE_ADMIN, (string)($_POST['clave_admin'] ?? ''))) {
    fallo("Clave de administrador incorrecta.", 'clave');
}

// 2. Tabla (solo las permitidas)
$tabla  = $_POST['tabla']  ?? '';
$accion = $_POST['accion'] ?? '';
if (!in_array($tabla, TABLAS_PERMITIDAS, true)) {
    fallo("Tabla no permitida.");
}

// ---------- SUBIR IMAGEN ----------
if ($accion === 'subir_imagen') {
    if (!isset($_FILES['archivo']) || $_FILES['archivo']['error'] !== UPLOAD_ERR_OK) {
        $cod = $_FILES['archivo']['error'] ?? -1;
        fallo(($cod === UPLOAD_ERR_INI_SIZE || $cod === UPLOAD_ERR_FORM_SIZE)
            ? "La imagen es demasiado grande para la configuración de PHP (upload_max_filesize)."
            : "No se recibió la imagen (código $cod).");
    }
    $f = $_FILES['archivo'];
    if ($f['size'] > 10 * 1024 * 1024) fallo("La imagen pesa más de 10 MB.");

    $info = @getimagesize($f['tmp_name']);
    if (!$info) fallo("El archivo no es una imagen válida.");
    $permitidos = [IMAGETYPE_JPEG => 'jpg', IMAGETYPE_PNG => 'png', IMAGETYPE_GIF => 'gif', IMAGETYPE_WEBP => 'webp'];
    if (!isset($permitidos[$info[2]])) fallo("Formato no permitido. Usa JPG, PNG, GIF o WEBP.");

    $base   = substr(preg_replace('/[^a-zA-Z0-9_-]/', '_', pathinfo($f['name'], PATHINFO_FILENAME)), 0, 40);
    $nombre = $base . '_' . date('Ymd_His') . '.' . $permitidos[$info[2]];

    if (!is_dir(CARPETA_IMAGENES) && !mkdir(CARPETA_IMAGENES, 0775, true)) {
        fallo("No se pudo crear la carpeta de imágenes: " . CARPETA_IMAGENES);
    }
    if (!move_uploaded_file($f['tmp_name'], CARPETA_IMAGENES . $nombre)) {
        fallo("No se pudo guardar la imagen en " . CARPETA_IMAGENES);
    }
    salida(['ok' => true, 'mensaje' => 'Imagen subida.', 'ruta' => RUTA_IMAGENES . $nombre]);
}

try {
    // 3. Leer la estructura real de la tabla
    $columnas = [];
    $pk = null;
    $res = $conexion->query("SHOW COLUMNS FROM `$tabla`");
    while ($c = $res->fetch_assoc()) {
        $columnas[] = [
            'nombre'  => $c['Field'],
            'tipo'    => $c['Type'],
            'nulo'    => $c['Null'] === 'YES',
            'llave'   => $c['Key'],
            'auto'    => stripos($c['Extra'], 'auto_increment') !== false,
            'defecto' => $c['Default'],
            'clave_secreta' => esContrasena($c['Field'])
        ];
        if ($c['Key'] === 'PRI' && $pk === null) {
            $pk = $c['Field'];
        }
    }
    // Sin llave primaria solo se puede ver, añadir y exportar
    $sinPk = "La tabla `$tabla` no tiene llave primaria (PRIMARY KEY): solo se puede ver y añadir. Agrégale un id para poder editar o borrar.";

    // ---------- LISTAR ----------
    if ($accion === 'listar') {
        // Columnas que son llave foránea: se devuelven las opciones válidas para elegir
        $fks = [];
        $rf = $conexion->query("SELECT COLUMN_NAME AS c, REFERENCED_TABLE_NAME AS t, REFERENCED_COLUMN_NAME AS rc
            FROM information_schema.KEY_COLUMN_USAGE
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '" . $conexion->real_escape_string($tabla) . "'
            AND REFERENCED_TABLE_NAME IS NOT NULL");
        while ($x = $rf->fetch_assoc()) { $fks[$x['c']] = $x; }

        foreach ($columnas as &$col) {
            if (!isset($fks[$col['nombre']])) continue;
            $rt = $fks[$col['nombre']]['t'];
            $rc = $fks[$col['nombre']]['rc'];
            $nombresRef = [];
            $rr = $conexion->query("SHOW COLUMNS FROM `$rt`");
            while ($z = $rr->fetch_assoc()) { $nombresRef[] = $z['Field']; }
            $etq = in_array('nombre', $nombresRef) ? 'nombre' : (in_array('correo', $nombresRef) ? 'correo' : null);
            $sel = "`$rc` AS v" . ($etq ? ", `$etq` AS e" : "");
            $q = $conexion->query("SELECT $sel FROM `$rt` ORDER BY `$rc` LIMIT 500");
            $ops = [];
            while ($o = $q->fetch_assoc()) {
                $ops[] = ['valor' => $o['v'], 'etiqueta' => $o['v'] . (isset($o['e']) ? ' — ' . $o['e'] : '')];
            }
            $col['opciones'] = $ops;
            $col['fk_tabla'] = $rt;
        }
        unset($col);

        $filas = [];
        $orden = $pk !== null ? "ORDER BY `$pk` DESC" : "";
        $r = $conexion->query("SELECT * FROM `$tabla` $orden LIMIT 500");
        while ($f = $r->fetch_assoc()) {
            foreach ($f as $nombre => $valor) {
                if (esContrasena($nombre) && $valor !== null) {
                    $f[$nombre] = '(encriptada)';
                }
            }
            $filas[] = $f;
        }
        salida(['ok' => true, 'columnas' => $columnas, 'pk' => $pk, 'filas' => $filas]);
    }

    // Datos del formulario (para crear y actualizar)
    $datos = json_decode($_POST['datos'] ?? '{}', true);
    if (!is_array($datos)) {
        $datos = [];
    }

    // Convierte lo escrito en el formulario en lo que se guarda
    // Devuelve [guardar?, valor]
    $preparar = function ($col, $esNuevo) use ($datos) {
        $nombre = $col['nombre'];
        if (!array_key_exists($nombre, $datos)) return [false, null];
        $valor = $datos[$nombre];

        if ($col['clave_secreta']) {
            if ($valor === '') return [false, null];          // vacío = no cambiar
            return [true, password_hash($valor, PASSWORD_BCRYPT)];
        }
        if ($valor === '') {
            if ($col['nulo'])            return [true, null];
            if (esTexto($col['tipo']))   return [true, ''];
            return [false, null];                              // usa el valor por defecto
        }
        return [true, $valor];
    };

    // ---------- CREAR ----------
    if ($accion === 'crear') {
        $campos = []; $valores = [];
        foreach ($columnas as $col) {
            if ($col['auto']) continue;
            [$guardar, $valor] = $preparar($col, true);
            if ($guardar) { $campos[] = "`{$col['nombre']}`"; $valores[] = $valor; }
        }
        if (count($campos) === 0) {
            $sql = "INSERT INTO `$tabla` () VALUES ()";
            $stmt = $conexion->prepare($sql);
        } else {
            $marcas = implode(',', array_fill(0, count($campos), '?'));
            $sql = "INSERT INTO `$tabla` (" . implode(',', $campos) . ") VALUES ($marcas)";
            $stmt = $conexion->prepare($sql);
            $stmt->bind_param(str_repeat('s', count($valores)), ...$valores);
        }
        $stmt->execute();
        salida(['ok' => true, 'mensaje' => 'Registro añadido.']);
    }

    // ---------- ACTUALIZAR ----------
    if ($accion === 'actualizar') {
        if ($pk === null) fallo($sinPk);
        $id = $_POST['id'] ?? '';
        if ($id === '') fallo("Falta el id del registro.");
        $sets = []; $valores = [];
        foreach ($columnas as $col) {
            if ($col['nombre'] === $pk || $col['auto']) continue;
            [$guardar, $valor] = $preparar($col, false);
            if ($guardar) { $sets[] = "`{$col['nombre']}` = ?"; $valores[] = $valor; }
        }
        if (count($sets) === 0) {
            salida(['ok' => true, 'mensaje' => 'No había cambios que guardar.']);
        }
        $valores[] = $id;
        $stmt = $conexion->prepare("UPDATE `$tabla` SET " . implode(', ', $sets) . " WHERE `$pk` = ?");
        $stmt->bind_param(str_repeat('s', count($valores)), ...$valores);
        $stmt->execute();
        salida(['ok' => true, 'mensaje' => 'Cambios guardados.']);
    }

    // ---------- BORRAR ----------
    if ($accion === 'borrar') {
        if ($pk === null) fallo($sinPk);
        $id = $_POST['id'] ?? '';
        if ($id === '') fallo("Falta el id del registro.");
        $stmt = $conexion->prepare("DELETE FROM `$tabla` WHERE `$pk` = ?");
        $stmt->bind_param('s', $id);
        $stmt->execute();
        salida(['ok' => true, 'mensaje' => 'Registro borrado.']);
    }

    fallo("Acción no válida.");

} catch (mysqli_sql_exception $e) {
    if ($e->getCode() === 1451) {
        fallo("No se puede borrar: otros registros (por ejemplo pedidos) dependen de este.");
    }
    if ($e->getCode() === 1062) {
        fallo("Ya existe un registro con ese valor único (por ejemplo un correo repetido).");
    }
    fallo("Error de base de datos: " . $e->getMessage());
}