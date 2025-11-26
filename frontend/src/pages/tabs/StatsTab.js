import React, { useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { MdBarChart, MdSearch } from 'react-icons/md';
import './StatsTab.css';

// Données superficielles simulées
const MOCK_STATS = {
  total_hebdo: 1967,
  moyenne_journaliere: 281,
  jour_max: 'Mercredi',
  valeur_max: 645,
  jour_min: 'Jeudi',
  valeur_min: 20,
  derniere_detection: '06-07-2025 17:22:11',
  nombre_detections: 402
};

const MOCK_CHART_DATA = {
  labels: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'],
  datasets: [{
    label: 'Détections',
    data: [567, 110, 645, 20, 589, 536, 0],
    backgroundColor: '#36a2eb'
  }]
};

const StatsTab = ({ chartData, stats }) => {
  const [jour, setJour] = useState('');
  const [mois, setMois] = useState('');
  const [annee, setAnnee] = useState('');
  const [result, setResult] = useState(null);

  const [date, setDate] = useState('');
  const [countResult, setCountResult] = useState(null);

  const handleRecherche = async () => {
    if (!jour && !mois && !annee) return;

    try {
      const url = new URL('http://localhost:5000/api/boeufs/recherche');
      if (jour) url.searchParams.append('jour', jour);
      if (mois) url.searchParams.append('mois', mois);
      if (annee) url.searchParams.append('annee', annee);

      const res = await fetch(url);
      const data = await res.json();
      setResult(data);
    } catch (error) {
      console.error('Erreur lors de la recherche multiple :', error);
      setResult({ jour: 7, mois: 102, annee: 317 });
    }
  };

  const handleSearch = async () => {
    if (!date) return;

    const selected = new Date(date);
    const jour = selected.getDate();
    const mois = selected.getMonth() + 1;
    const annee = selected.getFullYear();

    try {
      const res = await fetch(`http://localhost:5000/api/boeufs/count?jour=${jour}&mois=${mois}&annee=${annee}`);
      const data = await res.json();
      setCountResult(data.count || 0);
    } catch (err) {
      console.error("Erreur lors de la récupération par date :", err);
      // Fallback
      setCountResult(19);
    }
  };

  // 🔁 Valeurs fallback si non fournies par props
  const finalStats = stats || MOCK_STATS;
  const finalChartData = chartData || MOCK_CHART_DATA;

  return (
    <div className="stats-tab-container">
      <h1 className="align-title">
        <MdBarChart size={40} className="icon" /> Statistiques des détections
      </h1>

      {/* Cartes statistiques */}
      <div className="tiles">
        <div className="tile green">Total hebdo<br /><strong>{finalStats.total_hebdo}</strong> 🐄</div>
        <div className="tile blue">Moyenne/jour<br /><strong>{finalStats.moyenne_journaliere}</strong></div>
        <div className="tile red">Jour max<br /><strong>{finalStats.jour_max}</strong><br />({finalStats.valeur_max} 🐄)</div>
        <div className="tile orange">Jour min<br /><strong>{finalStats.jour_min}</strong><br />({finalStats.valeur_min} 🐄)</div>
        <div className="tile grey">Dernière détection<br /><strong>{finalStats.derniere_detection}</strong></div>
        <div className="tile purple">Détections totales<br /><strong>{finalStats.nombre_detections}</strong></div>
      </div>

      {/* Recherche par date unique */}
      <div className="search-section fade-in">
        <h2>Recherche par date précise</h2>
        <div className="search-fields">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <button className="btn-search" onClick={handleSearch}>
            <MdSearch size={18} /> Rechercher
          </button>
        </div>
        {countResult !== null && (
          <div className="search-results fade-in">
            Nombre de détections le <strong>{date}</strong> : <strong>{countResult}</strong> 🐄
          </div>
        )}
      </div>

      {/* Recherche personnalisée */}
      <div className="search-section fade-in">
        <h2>Recherche personnalisée</h2>
        <div className="search-fields">
          <input type="text" placeholder="Jour (ex: 12)" value={jour} onChange={(e) => setJour(e.target.value)} />
          <input type="text" placeholder="Mois (ex: 05)" value={mois} onChange={(e) => setMois(e.target.value)} />
          <input type="text" placeholder="Année (ex: 2025)" value={annee} onChange={(e) => setAnnee(e.target.value)} />
          <button className="btn-search" onClick={handleRecherche}>
            <MdSearch size={18} /> Rechercher
          </button>
        </div>
        {result && (
          <div className="search-results fade-in">
            {jour && <p><strong>Détections ce jour :</strong> {result.jour}</p>}
            {mois && <p><strong>Détections ce mois :</strong> {result.mois}</p>}
            {annee && <p><strong>Détections cette année :</strong> {result.annee}</p>}
          </div>
        )}
      </div>

      <div className="chart-container fade-in">
        <Bar
          data={finalChartData}
          options={{
            responsive: true,
            plugins: {
              legend: { display: false },
              title: {
                display: true,
                text: 'Nombre de bœufs détectés par jour',
                color: '#000',
                font: { size: 18 },
              },
            },
            scales: {
              x: { ticks: { color: '#000' }, grid: { color: '#eee' } },
              y: { beginAtZero: true, ticks: { color: '#000' }, grid: { color: '#eee' } },
            },
          }}
        />
      </div>
    </div>
  );
};

export default StatsTab;
