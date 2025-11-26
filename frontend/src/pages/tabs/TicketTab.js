import React, { useState, useRef } from 'react';
import './TicketTab.css';
import { RiTicket2Line } from 'react-icons/ri';
import { MdPrint, MdRefresh } from 'react-icons/md';

const TicketTab = () => {
  const [boucher, setBoucher] = useState('');
  const [nombreBoeufs, setNombreBoeufs] = useState('');
  const [ticketData, setTicketData] = useState(null);
  const printRef = useRef();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const date = new Date().toLocaleDateString('fr-FR');

    const data = {
      boucher,
      nombreBoeufs,
      date,
    };

    try {
      const res = await fetch('http://localhost:5000/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        setTicketData(data);
      } else {
        alert('Erreur lors de la création du ticket.');
      }
    } catch (err) {
      console.error(err);
      alert('Erreur de connexion au serveur.');
    }
  };

  const handlePrint = () => {
    const content = printRef.current.innerHTML;
    const win = window.open('', '', 'height=600,width=800');
    win.document.write('<html><head><title>Bon d\'abattage</title>');
    win.document.write('<style>body{font-family:Arial;padding:20px;} .ticket-box{border:1px solid #000;padding:20px;border-radius:10px;max-width:500px;margin:auto;}</style>');
    win.document.write('</head><body>');
    win.document.write(content);
    win.document.write('</body></html>');
    win.document.close();
    win.print();
  };

  const resetForm = () => {
    setBoucher('');
    setNombreBoeufs('');
    setTicketData(null);
  };

  return (

    <div className="ticket-tab-container">
      
      <h2 className="align-title">
        <RiTicket2Line className="icon" />
        Génération du bon d'abattage
      </h2>

      {!ticketData && (
        <form className="ticket-form" onSubmit={handleSubmit}>
          <label>
            Numéro du boucher :
            <input
              type="text"
              value={boucher}
              onChange={(e) => setBoucher(e.target.value)}
              required
            />
          </label>

          <label>
            Nombre de bœufs :
            <input
              type="number"
              value={nombreBoeufs}
              onChange={(e) => setNombreBoeufs(e.target.value)}
              required
              min={1}
            />
          </label>

          <button type="submit">🧾 Générer le Bon</button>
        </form>
      )}

      {ticketData && (
        <div className="ticket-preview">
          <div className="ticket-box" ref={printRef}>
            <h3 className="ticket-title">BON D'ABATTAGE</h3>
            <p>Date : {ticketData.date}</p>
            <p>Boucher N° : <strong>{ticketData.boucher}</strong></p>
            <p>Nombre de bœufs à abattre : <strong>{ticketData.nombreBoeufs}</strong></p>
            <div className="signature-zone">
              <p>Signé : <strong>Service Commercial</strong></p>
            </div>
          </div>

          <div className="ticket-actions">
            <button className="print-btn" onClick={handlePrint}>
              <MdPrint size={20} /> Imprimer
            </button>
            <button className="reset-btn" onClick={resetForm}>
              <MdRefresh size={20} /> Nouveau ticket
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketTab;
