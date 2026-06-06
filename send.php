<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

// Destino del correo
define('MAIL_TO',      'contacto@vitavetclinica.com');
define('MAIL_SUBJECT', 'Nueva solicitud de cita — VitaVet');

// ── Helpers ──────────────────────────────────────────────
function clean(string $v): string {
    return htmlspecialchars(strip_tags(trim($v)), ENT_QUOTES, 'UTF-8');
}
function json_out(bool $ok, string $msg): never {
    echo json_encode(['ok' => $ok, 'message' => $msg]);
    exit;
}

// ── Sólo POST ────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    json_out(false, 'Método no permitido.');
}

// ── Campos ───────────────────────────────────────────────
$name    = clean($_POST['name']    ?? '');
$email   = clean($_POST['email']   ?? '');
$phone   = clean($_POST['phone']   ?? '');
$service = clean($_POST['service'] ?? '');
$message = clean($_POST['message'] ?? '');

// ── Validación básica ────────────────────────────────────
if ($name === '' || $email === '' || $message === '') {
    http_response_code(422);
    json_out(false, 'Completa los campos obligatorios.');
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(422);
    json_out(false, 'El correo no tiene un formato válido.');
}

// ── Cuerpo del correo ─────────────────────────────────────
$body = "Nueva solicitud de cita recibida desde el sitio web de VitaVet.\n\n";
$body .= "Nombre:   $name\n";
$body .= "Email:    $email\n";
$body .= "Teléfono: $phone\n";
$body .= "Servicio: $service\n\n";
$body .= "Mensaje:\n$message\n";

// ── Headers ───────────────────────────────────────────────
$headers  = "From: VitaVet Web <no-reply@vitavetclinica.com>\r\n";
$headers .= "Reply-To: $name <$email>\r\n";
$headers .= "X-Mailer: PHP/" . phpversion() . "\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

// ── Envío ─────────────────────────────────────────────────
$sent = mail(MAIL_TO, MAIL_SUBJECT, $body, $headers);

if ($sent) {
    json_out(true, '¡Gracias! Te contactaremos muy pronto. 🐾');
} else {
    http_response_code(500);
    json_out(false, 'No pudimos enviar el mensaje. Por favor escríbenos directamente a ' . MAIL_TO);
}
