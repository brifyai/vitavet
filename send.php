<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require 'phpmailer/src/Exception.php';
require 'phpmailer/src/PHPMailer.php';
require 'phpmailer/src/SMTP.php';

// ── Security headers ──────────────────────────────────────
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: SAMEORIGIN');
header('Access-Control-Allow-Origin: https://vitavet.cl');
header('Access-Control-Allow-Methods: POST');

// ── Config ────────────────────────────────────────────────
define('MAIL_TO',      'contacto@vitavetclinica.com');
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

// ── Envío con PHPMailer y Gmail SMTP ──────────────────────
$mail = new PHPMailer(true);

try {
    // Configuración del servidor SMTP de Gmail
    $mail->isSMTP();
    $mail->Host       = 'smtp.gmail.com';
    $mail->SMTPAuth   = true;
    $mail->Username   = 'veterinagric@gmail.com'; // Tu correo Gmail
    $mail->Password   = 'znttzijvsubnnuyl';
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
    $mail->Port       = 465;
    $mail->CharSet    = 'UTF-8';

    // Remitentes y Destinatarios
    $mail->setFrom('veterinagric@gmail.com', 'VitaVet Web');
    $mail->addAddress(MAIL_TO); // Se envía a contacto@vitavetclinica.com o a quien definas en la config
    $mail->addReplyTo($email, $name); // Para que al hacer "Responder", le respondas al cliente

    // Contenido del Correo
    $mail->isHTML(false);
    $mail->Subject = MAIL_SUBJECT;
    $mail->Body    = $body;

    // Enviar
    $mail->send();
    json_out(true, '¡Gracias! Te contactaremos muy pronto. 🐾');
} catch (Exception $e) {
    http_response_code(500);
    // json_out(false, 'Mailer Error: ' . $mail->ErrorInfo); // Descomentar para ver errores técnicos
    json_out(false, 'No pudimos enviar el mensaje. Escríbenos a ' . MAIL_TO);
}
