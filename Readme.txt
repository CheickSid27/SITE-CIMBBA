CIMBBA — site vitrine, page À propos et showroom (refonte 2026)
================================================================

Pages
  index.html      Centre médical (accueil)
  a-propos.html   Fondateur, médecin principal, histoire, équipe, valeurs
  showroom.html   Showroom de matériel médical (catalogue + demande de devis)
  L'ancienne page d'accueil reste dans l'historique git (commit c75f97f).

Direction artistique
  Base : DA Dribbble « Medical and Healthcare Service Website » (Peterdraw Studio).
  Signature CIMBBA : tout le site parle le langage de l'imagerie médicale
  (loupe rayons X sur le hero, cadres « film de radiologie », tracé ECG,
  préchargeur en balayage d'échographe, transitions de page par scan).

Code
  assets/css/cimbba.css    Design system (couleurs et typo dans :root)
  assets/js/cimbba.js      Moteur d'animations : chaque effet s'active par un attribut
                           data-* (liste en tête du fichier)
  assets/js/showroom.js    Catalogue : pour ajouter un produit, compléter PRODUCTS
  assets/vendor/motion/    GSAP 3.13 (+ ScrollTrigger, Flip) et Lenis 1.1.13, hébergés localement

Contenus provisoires
  La page À propos contient des emplacements marqués « Contenu provisoire » :
  noms, biographies, diplômes, photos de l'équipe, dates de la frise.
  Ils seront remplis avec la fiche de collecte envoyée au client.

Images
  assets/img/maquettes/   Rendus extraits de « SIMULATIONS DES DIFFERENTES RÉALISATIONS 2.pdf »
  assets/img/stock/       Photos Unsplash (licence Unsplash, usage commercial libre)
  assets/img/new/         Logo (pictogramme) + photo réelle de la façade actuelle
  -> Remplacer par les vraies photos du centre, de l'équipe et des produits dès qu'elles existent.

Formulaires
  Rendez-vous et devis passent par Web3Forms (clé dans les champs access_key).
  Le devis peut aussi partir sur WhatsApp : numéro dans WHATSAPP (showroom.js).

Accessibilité
  Avec « réduire les animations » activé dans le système, ou si le JavaScript
  ne charge pas, toutes les pages restent lisibles et utilisables sans effets.

Les anciens fichiers assets/css/style.css, glass.css et les autres dossiers de
assets/vendor/ ne sont plus utilisés par les nouvelles pages.
