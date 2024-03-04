<?php
// Vérifie si la méthode de requête est POST
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Vérifie si tous les champs requis sont remplis
    if (isset($_POST['name']) && isset($_POST['email']) && isset($_POST['phone']) && isset($_POST['date']) && isset($_POST['department']) && isset($_POST['doctor'])) {
        // Nettoie les données des champs pour éviter les attaques XSS et les injections SQL
        $name = htmlspecialchars($_POST['name']);
        $email = htmlspecialchars($_POST['email']);
        $phone = htmlspecialchars($_POST['phone']);
        $date = htmlspecialchars($_POST['date']);
        $department = htmlspecialchars($_POST['department']);
        $doctor = htmlspecialchars($_POST['doctor']);
        $message = isset($_POST['message']) ? htmlspecialchars($_POST['message']) : '';

        // Vérifie si l'adresse e-mail est valide
        if (filter_var($email, FILTER_VALIDATE_EMAIL)) {
            // Les données sont valides, vous pouvez les utiliser pour envoyer un e-mail ou les enregistrer dans une base de données, etc.
            // Exemple d'envoi d'email :
            $to = 'famillesidibe1972@gmail.com';
            $subject = 'Nouveau rendez-vous en ligne';
            $message = "Nom et prénom : $name\n";
            $message .= "Adresse e-mail : $email\n";
            $message .= "Numéro de téléphone : $phone\n";
            $message .= "Date du rendez-vous : $date\n";
            $message .= "Département : $department\n";
            $message .= "Docteur : $doctor\n";
            $message .= "Message : $message\n";

            // Envoi de l'e-mail
            if (mail($to, $subject, $message)) {
                echo json_encode(array("success" => true, "message" => "Votre demande de rendez-vous a été envoyée avec succès. Merci !"));
            } else {
                echo json_encode(array("success" => false, "message" => "Problème lors de l'envoi de l'e-mail. Veuillez réessayer plus tard."));
            }
        } else {
            echo json_encode(array("success" => false, "message" => "Veuillez saisir une adresse e-mail valide."));
        }
    } else {
        echo json_encode(array("success" => false, "message" => "Veuillez remplir tous les champs requis."));
    }
} else {
    echo json_encode(array("success" => false, "message" => "Méthode de requête non autorisée."));
}
?>
