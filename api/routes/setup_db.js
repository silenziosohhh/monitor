const db = require("../db");

async function setup() {
  try {
    // setting up the database, hope nothing breaks
    console.log("Inizializzazione database...");

    // table for the services we want to monitor
    await db.query(`
      CREATE TABLE IF NOT EXISTS services (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        base_url VARCHAR(255) NOT NULL,
        enabled BOOLEAN NOT NULL DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // keeping track of the checks here
    await db.query(`
      CREATE TABLE IF NOT EXISTS checks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        service_id INT NOT NULL,
        status ENUM('online', 'degraded', 'offline'),
        http_code INT,
        response_time_ms INT,
        checked_at DATETIME NOT NULL,
        FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
        INDEX idx_checks_service_time (service_id, checked_at)
      )
    `);

    // events table for when stuff goes down or comes back up
    await db.query(`
      CREATE TABLE IF NOT EXISTS events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        service_id INT NOT NULL,
        type ENUM('RECOVERY', 'FAIL', 'DEGRADED'),
        created_at DATETIME NOT NULL,
        FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
        INDEX idx_events_service_time (service_id, created_at)
      )
    `);

    console.log("Tabelle create con successo.");

    // check if empty, if so add some test data
    const [rows] = await db.query("SELECT COUNT(*) as count FROM services");
    if (rows[0].count === 0) {
      console.log("Inserimento dati di test...");
      await db.query("INSERT INTO services (name, base_url, enabled) VALUES ('Google', 'https://google.com', 1), ('Bing', 'https://bing.com', 1)");
    }

    // all good, peace out
    process.exit(0);
  } catch (err) {
    // something went wrong
    console.error("Errore durante il setup:", err);
    process.exit(1);
  }
}

// let's get this party started
setup();