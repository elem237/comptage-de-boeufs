import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import Navbar from '../composants/Navbar';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);


const AdminPage = () => {
  const [chartData, setChartData] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetch("http://localhost:5000/api/boeufs/hebdomadaire")
      .then(res => res.json())
      .then(data => {
        const labels = Object.keys(data);
        const values = Object.values(data);

        setChartData({
          labels,
          datasets: [
            {
              label: 'Bœufs détectés',
              data: values,
              backgroundColor: labels.map((_, i) => i % 2 === 0 ? '#35AAFA' : '#BEFF99'),
              borderColor: '#F00',
              borderWidth: 2,
            },
          ],
        });
      })
      .catch(err => console.error("Erreur graphique :", err));

    fetch("http://localhost:5000/api/boeufs/stats")
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error("Erreur stats globales :", err));
  }, []);

  return (
    <>
      <Navbar />
      <div style={{ backgroundColor: '#FFA', minHeight: '100vh', padding: '40px', color: '#000' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>📈 Tableau de bord des détections</h1>

        {stats && (
          <div style={{
            backgroundColor: '#FFE',
            padding: '20px',
            marginBottom: '30px',
            borderRadius: '10px',
            boxShadow: '0 0 10px rgba(0,0,0,0.1)'
          }}>
            <h3>📊 Statistiques générales</h3>
            <p><strong>Total hebdomadaire :</strong> {stats.total_hebdo} 🐄</p>
            <p><strong>Moyenne par jour :</strong> {stats.moyenne_journaliere} 🐄</p>
            <p><strong>Jour max :</strong> {stats.jour_max} ({stats.valeur_max} 🐄)</p>
            <p><strong>Jour min :</strong> {stats.jour_min} ({stats.valeur_min} 🐄)</p>
            <p><strong>Dernière détection :</strong> {stats.derniere_detection}</p>
            <p><strong>Détections totales enregistrées :</strong> {stats.nombre_detections}</p>
          </div>
        )}

        {chartData && (
          <div style={{
            backgroundColor: '#FFF',
            padding: '20px',
            borderRadius: '10px',
            boxShadow: '0 0 10px rgba(0,0,0,0.1)'
          }}>
            <Bar data={chartData} options={{
              responsive: true,
              plugins: {
                legend: { display: false },
                title: {
                  display: true,
                  text: 'Nombre de bœufs détectés par jour',
                  color: '#000',
                  font: { size: 18 }
                }
              },
              scales: {
                x: {
                  ticks: { color: '#000' },
                  grid: { color: '#ddd' }
                },
                y: {
                  beginAtZero: true,
                  ticks: { color: '#000' },
                  grid: { color: '#ddd' }
                }
              }
            }} />
          </div>
        )}
      </div>
    </>
  );
};

export default AdminPage;
