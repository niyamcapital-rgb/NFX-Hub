body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background-color: #121824;
    color: #ffffff;
    margin: 0;
    padding: 20px;
}

.container {
    max-width: 900px;
    margin: 0 auto;
    display: grid;
    gap: 30px;
}

form {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    background: #1c2536;
    padding: 20px;
    border-radius: 8px;
}

input, select, button {
    padding: 10px;
    background: #2a374a;
    border: 1px solid #3f516d;
    color: white;
    border-radius: 4px;
}

button {
    background: #00b074;
    cursor: pointer;
    font-weight: bold;
    border: none;
}

button:hover {
    background: #009661;
}

table {
    width: 100%;
    border-collapse: collapse;
    background: #1c2536;
    border-radius: 8px;
    overflow: hidden;
}

th, td {
    padding: 12px;
    text-align: left;
    border-bottom: 1px solid #2a374a;
}

th {
    background-color: #243044;
}

.profit { color: #00b074; }
.loss { color: #ff4a4a; }