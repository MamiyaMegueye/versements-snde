-- ========================================
-- SCHEMA BASE DE DONNÉES - VERSEMENTS SNDE
-- À exécuter sur Neon PostgreSQL
-- ========================================

CREATE TABLE IF NOT EXISTS centres (
    id INTEGER PRIMARY KEY,
    nom VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS utilisateurs (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nom_complet VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'dfc' CHECK (role IN ('admin', 'dfc')),
    actif BOOLEAN DEFAULT TRUE,
    date_creation TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS versements (
    id SERIAL PRIMARY KEY,
    centre_id INTEGER NOT NULL REFERENCES centres(id),
    date_versement DATE NOT NULL,
    montant NUMERIC(15, 2) NOT NULL,
    banque VARCHAR(100),
    numero_bordereau VARCHAR(100),
    observations TEXT,
    image_bordereau TEXT,
    saisi_par INTEGER REFERENCES utilisateurs(id),
    date_saisie TIMESTAMP DEFAULT NOW(),
    modifie_le TIMESTAMP
);

CREATE TABLE IF NOT EXISTS historique (
    id SERIAL PRIMARY KEY,
    versement_id INTEGER REFERENCES versements(id),
    action VARCHAR(20) NOT NULL,
    utilisateur_id INTEGER REFERENCES utilisateurs(id),
    details TEXT,
    date_action TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_versements_centre ON versements(centre_id);
CREATE INDEX idx_versements_date ON versements(date_versement);
CREATE INDEX idx_versements_saisi_par ON versements(saisi_par);

-- ========================================
-- INSERTION DES CENTRES
-- ========================================
INSERT INTO centres (id, nom) VALUES
(14, 'BENICHAB'),
(15, 'CHAMI'),
(16, 'AOUJEFT'),
(17, 'CHINGHITI'),
(18, 'OUADANE'),
(19, 'MOUDJERIA'),
(20, 'TICHIT'),
(21, 'FDEIRICK'),
(23, 'RKIZ'),
(24, 'KEUR MACENE'),
(25, 'BABABE'),
(26, 'M''BAGNE'),
(27, 'MAGHAMA'),
(28, 'MONGUEL'),
(29, 'OULD YENGE'),
(30, 'BARKEOL'),
(31, 'BOUMDEID'),
(32, 'TAMCHAKET'),
(33, 'OULATA'),
(34, 'AMOURJ'),
(35, 'ADEL BAGROU'),
(36, 'SANGRAVA'),
(37, 'VASALA'),
(38, 'TERMISSE'),
(39, 'KIFFA2'),
(40, 'NOUADHIBOU 3'),
(41, 'TEYARETT2'),
(42, 'CARREFOUR2'),
(43, 'TEVRAGHZEINA-SUD'),
(44, 'DAR NAIM-NORD'),
(45, 'MELLAH'),
(46, 'MALLAH 2'),
(47, 'TEYARETT'),
(48, 'DAR NAIM SUD 2'),
(49, 'TARHIL1'),
(50, 'TARHIL2'),
(51, 'TARHIL3'),
(52, 'MALLAH 3'),
(53, 'RIYAD2'),
(55, 'TEVRAGHZEINA-NORD 3'),
(59, 'BOULENOIR'),
(60, 'NOUADHIBOU 1'),
(61, 'BOGHE'),
(62, 'AKJOUJT'),
(63, 'KHADAMATY'),
(64, 'ROSSO'),
(65, 'KAEDI'),
(66, 'ATAR'),
(67, 'ALEG'),
(68, 'BOUTILIMIT'),
(69, 'MEDERDRA'),
(70, 'AIOUN EL ATROUSS'),
(71, 'NEMA'),
(72, 'TIMBEDRA'),
(73, 'KIFFA1'),
(74, 'GUEROU'),
(75, 'SELIBABY'),
(76, 'M''BOUT'),
(77, 'MAGTALAHAJAR'),
(78, 'TIDJIKJA'),
(80, 'NOUADHIBOU 2'),
(81, 'DJIGUENI'),
(82, 'KANKOUSSA'),
(83, 'KOUBENNI'),
(84, 'BASSIKNOU'),
(85, 'TINTANE NOUVEAU'),
(86, 'WAD NAGA'),
(87, 'CHOGGAR'),
(88, 'N''BEIKETTE LEHWACH'),
(89, 'RIYAD1'),
(90, 'ARAFAT'),
(91, 'TEVRAGHZEINA-NORD 1'),
(92, 'CAPITALE'),
(93, 'SEBKHA'),
(94, 'EL MINA 1'),
(95, 'CARREFOUR1'),
(96, 'KSAR'),
(97, 'TEVRAGH ZEINA NORD 2'),
(98, 'TOUJOUNINE'),
(99, 'DAR NAIM-SUD 1'),
(101, 'AIWNAT ZBEL'),
(102, 'TOUIL'),
(103, 'BOUHDIDA'),
(104, 'MAAL'),
(105, 'LEXEIBA'),
(106, 'WOMPOU'),
(107, 'GABOU'),
(108, 'TEKANE')
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- UTILISATEUR ADMIN PAR DÉFAUT
-- Mot de passe: admin123 (à changer !)
-- Hash bcrypt de "admin123"
-- ========================================
INSERT INTO utilisateurs (username, password_hash, nom_complet, role)
VALUES ('admin', '$2b$12$LJ3m4ys3Lk0TSwHgFmQZxOYhWFyBj0tYBfLJq5x6HQyVpNfMhRWy', 'Administrateur', 'admin')
ON CONFLICT (username) DO NOTHING;
