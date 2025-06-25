
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const port = 3000;

app.use(express.json());

// Configuração CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// Configuração do banco de dados SQLite
const db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        console.error('Erro ao abrir o banco de dados:', err.message);
    } else {
        console.log('Conectado ao banco de dados SQLite.');
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT
        )`);
        db.run(`CREATE TABLE IF NOT EXISTS students (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            phone TEXT,
            email TEXT,
            level TEXT
        )`);
        db.run(`CREATE TABLE IF NOT EXISTS classes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            day TEXT,
            time TEXT,
            level TEXT
        )`);
        db.run(`CREATE TABLE IF NOT EXISTS payments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id INTEGER,
            amount REAL,
            num_classes INTEGER DEFAULT 1,
            payment_date TEXT,
            FOREIGN KEY (student_id) REFERENCES students(id)
        )`);
        db.run(`CREATE TABLE IF NOT EXISTS consumed_classes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id INTEGER,
            class_id INTEGER,
            date TEXT,
            time TEXT,
            FOREIGN KEY (student_id) REFERENCES students(id),
            FOREIGN KEY (class_id) REFERENCES classes(id)
        )`);

        // Inserir usuário padrão se não existir
        db.get(`SELECT * FROM users WHERE username = 'Ricardo'`, (err, row) => {
            if (!row) {
                db.run(`INSERT INTO users (username, password) VALUES (?, ?)`, ['Ricardo', 'R1c@rd0'], (err) => {
                    if (err) {
                        console.error('Erro ao inserir usuário padrão:', err.message);
                    } else {
                        console.log('Usuário padrão Ricardo inserido.');
                    }
                });
            }
        });
    }
});

// Rota de login
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    db.get(`SELECT * FROM users WHERE username = ? AND password = ?`, [username, password], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (row) {
            res.json({ message: 'Login bem-sucedido!' });
        } else {
            res.status(401).json({ message: 'Credenciais inválidas.' });
        }
    });
});

// Rotas para CRUD de alunos
// ... (serão adicionadas posteriormente)

// Iniciar o servidor
app.listen(port, () => {
    console.log(`Servidor backend rodando em http://localhost:${port}`);
});




// Rotas para CRUD de alunos

// Adicionar novo aluno
app.post("/students", (req, res) => {
    const { name, phone, email, level } = req.body;
    db.run(
        `INSERT INTO students (name, phone, email, level) VALUES (?, ?, ?, ?)`,
        [name, phone, email, level],
        function (err) {
            if (err) {
                res.status(400).json({ error: err.message });
                return;
            }
            res.json({
                message: "Aluno adicionado com sucesso!",
                data: { id: this.lastID, name, phone, email, level },
            });
        }
    );
});

// Obter todos os alunos
app.get("/students", (req, res) => {
    db.all(`SELECT * FROM students`, [], (err, rows) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({
            message: "Sucesso",
            data: rows,
        });
    });
});

// Obter aluno por ID
app.get("/students/:id", (req, res) => {
    db.get(`SELECT * FROM students WHERE id = ?`, [req.params.id], (err, row) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        if (row) {
            res.json({
                message: "Sucesso",
                data: row,
            });
        } else {
            res.status(404).json({ message: "Aluno não encontrado." });
        }
    });
});

// Atualizar aluno
app.put("/students/:id", (req, res) => {
    const { name, phone, email, level } = req.body;
    db.run(
        `UPDATE students SET name = ?, phone = ?, email = ?, level = ? WHERE id = ?`,
        [name, phone, email, level, req.params.id],
        function (err) {
            if (err) {
                res.status(400).json({ error: err.message });
                return;
            }
            if (this.changes === 0) {
                res.status(404).json({ message: "Aluno não encontrado para atualização." });
            } else {
                res.json({
                    message: "Aluno atualizado com sucesso!",
                    data: { id: req.params.id, name, phone, email, level },
                });
            }
        }
    );
});

// Deletar aluno
app.delete("/students/:id", (req, res) => {
    db.run(`DELETE FROM students WHERE id = ?`, req.params.id, function (err) {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ message: "Aluno não encontrado para exclusão." });
        } else {
            res.json({ message: "Aluno excluído com sucesso!", changes: this.changes });
        }
    });
});




// Rotas para CRUD de aulas/horários

// Adicionar nova aula/horário
app.post("/classes", (req, res) => {
    const { day, time, level } = req.body;
    db.run(
        `INSERT INTO classes (day, time, level) VALUES (?, ?, ?)`,
        [day, time, level],
        function (err) {
            if (err) {
                res.status(400).json({ error: err.message });
                return;
            }
            res.json({
                message: "Aula/horário adicionado com sucesso!",
                data: { id: this.lastID, day, time, level },
            });
        }
    );
});

// Obter todas as aulas/horários
app.get("/classes", (req, res) => {
    db.all(`SELECT * FROM classes`, [], (err, rows) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({
            message: "Sucesso",
            data: rows,
        });
    });
});

// Obter aula/horário por ID
app.get("/classes/:id", (req, res) => {
    db.get(`SELECT * FROM classes WHERE id = ?`, [req.params.id], (err, row) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        if (row) {
            res.json({
                message: "Sucesso",
                data: row,
            });
        } else {
            res.status(404).json({ message: "Aula/horário não encontrado." });
        }
    });
});

// Atualizar aula/horário
app.put("/classes/:id", (req, res) => {
    const { day, time, level } = req.body;
    db.run(
        `UPDATE classes SET day = ?, time = ?, level = ? WHERE id = ?`,
        [day, time, level, req.params.id],
        function (err) {
            if (err) {
                res.status(400).json({ error: err.message });
                return;
            }
            if (this.changes === 0) {
                res.status(404).json({ message: "Aula/horário não encontrado para atualização." });
            } else {
                res.json({
                    message: "Aula/horário atualizado com sucesso!",
                    data: { id: req.params.id, day, time, level },
                });
            }
        }
    );
});

// Deletar aula/horário
app.delete("/classes/:id", (req, res) => {
    db.run(`DELETE FROM classes WHERE id = ?`, req.params.id, function (err) {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ message: "Aula/horário não encontrado para exclusão." });
        } else {
            res.json({ message: "Aula/horário excluído com sucesso!", changes: this.changes });
        }
    });
});




// Rotas para Pagamentos

// Registrar novo pagamento
app.post('/payments', (req, res) => {
    const { student_id, amount, num_classes, payment_date } = req.body;
    
    db.run('INSERT INTO payments (student_id, amount, num_classes, payment_date) VALUES (?, ?, ?, ?)', 
           [student_id, amount, num_classes || 1, payment_date], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ 
            message: "Pagamento registrado com sucesso!",
            data: { id: this.lastID, student_id, amount, num_classes, payment_date }
        });
    });
});

// Obter todos os pagamentos (opcionalmente filtrado por student_id)
app.get("/payments", (req, res) => {
    const student_id = req.query.student_id;
    let sql = `SELECT * FROM payments`;
    let params = [];

    if (student_id) {
        sql += ` WHERE student_id = ?`;
        params.push(student_id);
    }

    db.all(sql, params, (err, rows) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({
            message: "Sucesso",
            data: rows,
        });
    });
});

// Obter pagamento por ID
app.get("/payments/:id", (req, res) => {
    db.get(`SELECT * FROM payments WHERE id = ?`, [req.params.id], (err, row) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        if (row) {
            res.json({
                message: "Sucesso",
                data: row,
            });
        } else {
            res.status(404).json({ message: "Pagamento não encontrado." });
        }
    });
});

// Atualizar pagamento
app.put("/payments/:id", (req, res) => {
    const { student_id, amount, num_classes, payment_date } = req.body;
    db.run(
        `UPDATE payments SET student_id = ?, amount = ?, num_classes = ?, payment_date = ? WHERE id = ?`,
        [student_id, amount, num_classes || 1, payment_date, req.params.id],
        function (err) {
            if (err) {
                res.status(400).json({ error: err.message });
                return;
            }
            if (this.changes === 0) {
                res.status(404).json({ message: "Pagamento não encontrado para atualização." });
            } else {
                res.json({
                    message: "Pagamento atualizado com sucesso!",
                    data: { id: req.params.id, student_id, amount, num_classes, payment_date },
                });
            }
        }
    );
});

// Deletar pagamento
app.delete("/payments/:id", (req, res) => {
    db.run(`DELETE FROM payments WHERE id = ?`, req.params.id, function (err) {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ message: "Pagamento não encontrado para exclusão." });
        } else {
            res.json({ message: "Pagamento excluído com sucesso!", changes: this.changes });
        }
    });
});




// Rotas para Aulas Consumidas

// Registrar nova aula consumida
app.post("/consumed-classes", (req, res) => {
    const { student_id, class_id, date, time } = req.body;
    db.run(
        `INSERT INTO consumed_classes (student_id, class_id, date, time) VALUES (?, ?, ?, ?)`,
        [student_id, class_id, date, time],
        function (err) {
            if (err) {
                res.status(400).json({ error: err.message });
                return;
            }
            res.json({
                message: "Aula consumida registrada com sucesso!",
                data: { id: this.lastID, student_id, class_id, date, time },
            });
        }
    );
});

// Obter todas as aulas consumidas (opcionalmente filtrado por student_id)
app.get("/consumed-classes", (req, res) => {
    const student_id = req.query.student_id;
    let sql = `SELECT * FROM consumed_classes`;
    let params = [];

    if (student_id) {
        sql += ` WHERE student_id = ?`;
        params.push(student_id);
    }

    db.all(sql, params, (err, rows) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({
            message: "Sucesso",
            data: rows,
        });
    });
});

// Obter aula consumida por ID
app.get("/consumed-classes/:id", (req, res) => {
    db.get(`SELECT * FROM consumed_classes WHERE id = ?`, [req.params.id], (err, row) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        if (row) {
            res.json({
                message: "Sucesso",
                data: row,
            });
        } else {
            res.status(404).json({ message: "Aula consumida não encontrada." });
        }
    });
});

// Deletar aula consumida
app.delete("/consumed-classes/:id", (req, res) => {
    db.run(`DELETE FROM consumed_classes WHERE id = ?`, req.params.id, function (err) {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ message: "Aula consumida não encontrada para exclusão." });
        } else {
            res.json({ message: "Aula consumida excluída com sucesso!", changes: this.changes });
        }
    });
});




// Rotas para Estatísticas

// Obter estatísticas de aulas por aluno (aulas pagas vs. aulas consumidas)
app.get('/statistics', (req, res) => {
    const sql = `
        SELECT 
            s.id AS student_id,
            s.name AS student_name,
            COALESCE(p.total_paid_amount, 0) AS total_paid_amount,
            COALESCE(p.total_paid_classes, 0) AS total_paid_classes,
            COALESCE(p.total_payments, 0) AS total_payments,
            COALESCE(c.total_consumed_classes, 0) AS total_consumed_classes,
            COALESCE(p.total_paid_classes, 0) - COALESCE(c.total_consumed_classes, 0) AS balance_classes
        FROM students s
        LEFT JOIN (
            SELECT 
                student_id,
                SUM(amount) AS total_paid_amount,
                SUM(num_classes) AS total_paid_classes,
                COUNT(*) AS total_payments
            FROM payments
            GROUP BY student_id
        ) p ON s.id = p.student_id
        LEFT JOIN (
            SELECT 
                student_id,
                COUNT(*) AS total_consumed_classes
            FROM consumed_classes
            GROUP BY student_id
        ) c ON s.id = c.student_id
        ORDER BY s.name;
    `;

    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({
            message: "Estatísticas obtidas com sucesso!",
            data: rows
        });
    });
});

// Obter estatísticas dos alunos
app.get('/statistics', (req, res) => {
    const sql = `
        SELECT 
            s.id as student_id,
            s.name as student_name,
            COALESCE(SUM(p.amount), 0) as total_paid_amount,
            COALESCE(SUM(p.num_classes), 0) as total_paid_classes,
            COUNT(DISTINCT p.id) as total_payments,
            COUNT(DISTINCT cc.id) as total_consumed_classes,
            (COALESCE(SUM(p.num_classes), 0) - COUNT(DISTINCT cc.id)) as balance_classes
        FROM students s
        LEFT JOIN payments p ON s.id = p.student_id
        LEFT JOIN consumed_classes cc ON s.id = cc.student_id
        GROUP BY s.id, s.name
        ORDER BY s.name
    `;
    
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({
            message: "Estatísticas obtidas com sucesso!",
            data: rows
        });
    });
});

// Obter histórico de aulas consumidas por aluno
app.get("/statistics/consumed-history/:student_id", (req, res) => {
    const student_id = req.params.student_id;
    db.all(
        `SELECT cc.date, cc.time, c.day, c.time AS class_time, c.level AS class_level
         FROM consumed_classes cc
         JOIN classes c ON cc.class_id = c.id
         WHERE cc.student_id = ?
         ORDER BY cc.date DESC, cc.time DESC`,
        [student_id],
        (err, rows) => {
            if (err) {
                res.status(400).json({ error: err.message });
                return;
            }
            res.json({
                message: "Sucesso",
                data: rows,
            });
        }
    );
});




// Endpoint para registrar aulas consumidas (Controle de Aulas)
app.post('/class-attendance', (req, res) => {
    const { class_id, class_date, student_ids } = req.body;
    
    if (!class_id || !class_date || !student_ids || !Array.isArray(student_ids)) {
        res.status(400).json({ error: 'Dados inválidos. Necessário class_id, class_date e student_ids (array).' });
        return;
    }
    
    // Inserir registros de presença para cada aluno
    const stmt = db.prepare('INSERT INTO consumed_classes (student_id, class_id, class_date) VALUES (?, ?, ?)');
    
    let insertedCount = 0;
    let errors = [];
    
    student_ids.forEach((student_id, index) => {
        stmt.run([student_id, class_id, class_date], function(err) {
            if (err) {
                errors.push({ student_id, error: err.message });
            } else {
                insertedCount++;
            }
            
            // Verificar se é o último item
            if (index === student_ids.length - 1) {
                stmt.finalize();
                
                if (errors.length > 0) {
                    res.status(207).json({ 
                        message: `${insertedCount} presenças registradas com sucesso, ${errors.length} com erro.`,
                        inserted: insertedCount,
                        errors: errors
                    });
                } else {
                    res.json({ 
                        message: `${insertedCount} presenças registradas com sucesso!`,
                        inserted: insertedCount
                    });
                }
            }
        });
    });
});


// Iniciar servidor
app.listen(port, '0.0.0.0', () => {
    console.log(`Servidor backend rodando em http://localhost:${port}`);
});

