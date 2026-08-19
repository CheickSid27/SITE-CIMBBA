<?php
// Adresse de réception des demandes de rendez-vous
$receiving_email_address = 'famillesidibe1972@gmail.com';

header('Content-Type: text/plain; charset=utf-8');

if ($_SERVER["REQUEST_METHOD"] != "POST") {
    die('Méthode de requête non autorisée.');
}

if (!isset($_POST['name']) || !isset($_POST['email']) || !isset($_POST['phone']) || !isset($_POST['date']) || !isset($_POST['department']) || !isset($_POST['doctor'])) {
    die('Veuillez remplir tous les champs requis.');
}

$name = htmlspecialchars($_POST['name']);
$email = htmlspecialchars($_POST['email']);
$phone = htmlspecialchars($_POST['phone']);
$date = htmlspecialchars($_POST['date']);
$department = htmlspecialchars($_POST['department']);
$doctor = htmlspecialchars($_POST['doctor']);
$patient_message = isset($_POST['message']) ? htmlspecialchars($_POST['message']) : '';

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    die('Veuillez saisir une adresse e-mail valide.');
}

$to = $receiving_email_address;
$mail_subject = 'Nouveau rendez-vous en ligne';
$body = "Nom et prénom : $name\n";
$body .= "Adresse e-mail : $email\n";
$body .= "Numéro de téléphone : $phone\n";
$body .= "Date du rendez-vous : $date\n";
$body .= "Département : $department\n";
$body .= "Docteur : $doctor\n";
$body .= "Message : $patient_message\n";
$headers = "From: $name <$email>\r\nReply-To: $email\r\n";

if (mail($to, $mail_subject, $body, $headers)) {
    echo 'OK';
} else {
    echo "Problème lors de l'envoi de l'e-mail. Veuillez réessayer plus tard.";
}
?>
