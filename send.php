<?php
// ── Security headers ──────────────────────────────────────
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: SAMEORIGIN');
header('Access-Control-Allow-Origin: https://vitavet.cl');
header('Access-Control-Allow-Methods: POST');

// ── Config ────────────────────────────────────────────────
define('MAIL_TO',      'contacto@vitavet.cl');
define('MAIL_SUBJECT', 'Nueva solicitud de cita — VitaVet');
define('RATE_LIMIT',   60);   // segundos entre envíos por IP
define('RATE_FILE',    sys_get_temp_dir() . '/vitavet_rate_');

// ── Helpers ───────────────────────────────────────────────
function clean(string $v): string {
    return htmlspecialchars(strip_tags(trim($v)), ENT_QUOTES, 'UTF-8');
}
function json_out(bool $ok, string $msg): never {
    echo json_encode(['ok' => $ok, 'message' => $msg]);
    exit;
}

// ── Solo POST ─────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    json_out(false, 'Método no permitido.');
}

// ── Rate limiting por IP (1 envío por minuto) ─────────────
$ip       = preg_replace('/[^0-9a-fA-F:.]/', '', $_SERVER['REMOTE_ADDR'] ?? '');
$rateFile = RATE_FILE . md5($ip);
if (file_exists($rateFile) && (time() - (int)file_get_contents($rateFile)) < RATE_LIMIT) {
    http_response_code(429);
    json_out(false, 'Demasiados intentos. Por favor espera un momento.');
}

// ── Campos ────────────────────────────────────────────────
$name    = clean($_POST['name']    ?? '');
$email   = clean($_POST['email']   ?? '');
$phone   = clean($_POST['phone']   ?? '');
$service = clean($_POST['service'] ?? '');
$message = clean($_POST['message'] ?? '');

// ── Validación ────────────────────────────────────────────
if ($name === '' || $email === '' || $message === '') {
    http_response_code(422);
    json_out(false, 'Completa los campos obligatorios.');
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(422);
    json_out(false, 'El correo no tiene un formato válido.');
}
if (strlen($name) > 120 || strlen($message) > 3000 || strlen($phone) > 30) {
    http_response_code(422);
    json_out(false, 'Uno o más campos exceden el largo permitido.');
}
if (!preg_match('/^[\p{L}\s\-\.\']+$/u', $name)) {
    http_response_code(422);
    json_out(false, 'El nombre contiene caracteres no válidos.');
}

// ── Registrar envío (rate limiting) ───────────────────────
file_put_contents($rateFile, (string)time(), LOCK_EX);

// ── Cuerpo del correo ─────────────────────────────────────
$body  = "Nueva solicitud de cita recibida desde vitavet.cl\n\n";
$body .= "Nombre:   {$name}\n";
$body .= "Email:    {$email}\n";
$body .= "Teléfono: {$phone}\n";
$body .= "Servicio: {$service}\n\n";
$body .= "Mensaje:\n{$message}\n";

// ── Headers del correo ────────────────────────────────────
$headers  = "From: VitaVet Web <no-reply@vitavet.cl>\r\n";
$headers .= "Reply-To: {$name} <{$email}>\r\n";
$headers .= "X-Mailer: PHP/" . phpversion() . "\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

// ── Envío ─────────────────────────────────────────────────
$sent = mail(MAIL_TO, MAIL_SUBJECT, $body, $headers);

if ($sent) {
    json_out(true, '¡Gracias! Te contactaremos muy pronto. 🐾');
} else {
    http_response_code(500);
    json_out(false, 'No pudimos enviar el mensaje. Escríbenos a ' . MAIL_TO);
}
