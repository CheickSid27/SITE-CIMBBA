<?php
// Adresse de réception des messages du formulaire de contact
$receiving_email_address = 'famillesidibe1972@gmail.com';

header('Content-Type: text/plain; charset=utf-8');

if ($_SERVER["REQUEST_METHOD"] != "POST") {
    die('Méthode de requête non autorisée.');
}

if (!isset($_POST['name']) || !isset($_POST['email']) || !isset($_POST['subject']) || !isset($_POST['message'])) {
    die('Veuillez remplir tous les champs requis.');
}

$name = htmlspecialchars($_POST['name']);
$email = htmlspecialchars($_POST['email']);
$subject = htmlspecialchars($_POST['subject']);
$message = htmlspecialchars($_POST['message']);

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    die('Veuillez saisir une adresse e-mail valide.');
}

$to = $receiving_email_address;
$mail_subject = 'Nouveau message du site CIMBBA : ' . $subject;
$body = "Nom et prénom : $name\n";
$body .= "Adresse e-mail : $email\n";
$body .= "Sujet : $subject\n";
$body .= "Message : $message\n";
$headers = "From: $name <$email>\r\nReply-To: $email\r\n";

if (mail($to, $mail_subject, $body, $headers)) {
    echo 'OK';
} else {
    echo "Problème lors de l'envoi de l'e-mail. Veuillez réessayer plus tard.";
}
?>
