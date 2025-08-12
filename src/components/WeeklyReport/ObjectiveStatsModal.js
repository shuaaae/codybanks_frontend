import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';

// Utility: format numbers with commas and up to 2 decimals
const formatNumber = (num) =>
  num.toLocaleString(undefined, { maximumFractionDigits: 2 });

// Utility: build the analysis sentence
const getAnalysisText = (analysis, type) => {
  const dayLabel = analysis.days === 1 ? "day" : "days";
  const objectiveName = type === "lord" ? "Lord" : "Turtle";
  const objectiveLower = objectiveName.toLowerCase();
  const percent = formatNumber(analysis.percentage);

  return `Based on the data for ${analysis.days} ${dayLabel}, the total number of ${objectiveName} respawns is ${formatNumber(
    analysis.totalRespawns
  )}, and the total takes is ${formatNumber(
    analysis.totalTakes
  )}. Therefore, our team secured ${percent}% of all ${objectiveLower}s.`;
};

export default function ObjectiveStatsModal({
  isOpen,
  onClose,
  type, // 'turtle' | 'lord'
  rows, // [{ date: 'yyyy-mm-dd', our: number, opp: number, label: 'x-y' }]
  analysis, // { days, totalRespawns, totalTakes, percentage }
  weeks = [],
  selectedWeek = '',
  onSelectWeek
}) {
  const [enter, setEnter] = useState(false);
  useEffect(() => {
    if (isOpen) {
      const id = requestAnimationFrame(() => setEnter(true));
      return () => cancelAnimationFrame(id);
    }
    setEnter(false);
  }, [isOpen]);

  if (!isOpen) return null;

  const title = type === 'lord' ? 'Lord Statistics' : 'Turtle Statistics';

  const chartData = {
    labels: rows.map((r) => r.date),
    datasets: [
      {
        label: 'Takes',
        data: rows.map(r => r.our),
        backgroundColor: '#3b82f6',
        order: 0
      },
      {
        label: 'Trend',
        data: rows.map(r => r.our),
        type: 'line',
        borderColor: '#facc15',
        backgroundColor: '#facc15',
        fill: false,
        borderWidth: 3,
        tension: 0.3,
        yAxisID: 'y1',
        pointRadius: 3,
        order: 10,
        z: 10
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      tooltip: { mode: 'index', intersect: false }
    },
    scales: {
      y: { beginAtZero: true, ticks: { stepSize: 1 } },
      y1: { beginAtZero: true, position: 'right', grid: { drawOnChartArea: false } }
    }
  };

  // Plugin to redraw line datasets on top (ensures they appear in front of bars)
  const bringLineFront = {
    id: 'bring-line-front',
    afterDatasetsDraw(chart) {
      const { ctx } = chart;
      chart.data.datasets.forEach((ds, i) => {
        if (ds.type === 'line') {
          const meta = chart.getDatasetMeta(i);
          if (!meta.hidden) {
            meta.dataset.draw(ctx);
            meta.data.forEach(el => el.draw(ctx));
          }
        }
      });
    }
  };

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center transition-opacity duration-300 ${enter ? 'bg-black bg-opacity-80 opacity-100' : 'bg-black bg-opacity-0 opacity-0'}`}
      onClick={(e) => {
        // close when clicking on backdrop only
        if (e.target === e.currentTarget) onClose && onClose();
      }}
    >
      <div className={`bg-[#23232a] rounded-2xl shadow-2xl w-[90vw] max-w-[1100px] h-[80vh] p-6 overflow-hidden transform transition-transform duration-300 ${enter ? 'scale-100 translate-y-0' : 'scale-95 translate-y-2'}`}>
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-white text-xl font-bold">{title}</h2>
            {weeks.length > 0 && (
              <select
                value={selectedWeek}
                onChange={(e) => onSelectWeek && onSelectWeek(e.target.value, type)}
                className="bg-gray-700 text-white text-sm rounded px-2 py-1"
                title="Select week"
              >
                {weeks.map(wk => (
                  <option key={wk} value={wk}>{wk}</option>
                ))}
              </select>
            )}
          </div>
          <button className="text-gray-400 hover:text-white text-2xl font-bold" onClick={onClose}>&times;</button>
        </div>

        <div className="grid grid-cols-2 gap-4 h-[calc(80vh-80px)]">
          <div className="bg-gray-800 rounded-lg p-3 h-full">
            <div className="text-yellow-300 font-bold mb-2 text-sm">{title}</div>
            <div className="w-full h-[90%]">
              <Bar data={chartData} options={options} plugins={[bringLineFront]} />
            </div>
          </div>
          <div className="flex flex-col gap-3 h-full overflow-hidden">
            <div className="bg-gray-800 rounded-lg p-3 flex-1 overflow-auto">
              <div className="text-yellow-300 font-bold mb-2 text-sm">Matches</div>
              <table className="w-full text-left text-xs text-gray-200">
                <thead>
                  <tr className="text-gray-300">
                    <th className="py-1 px-2">Date</th>
                    <th className="py-1 px-2">Takes</th>
                    <th className="py-1 px-2">Our</th>
                    <th className="py-1 px-2">Opp</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, idx) => (
                    <tr key={idx} className="border-t border-gray-700">
                      <td className="py-1 px-2">{r.date}</td>
                      <td className="py-1 px-2">{r.label}</td>
                      <td className="py-1 px-2">{r.our}</td>
                      <td className="py-1 px-2">{r.opp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="text-yellow-300 font-bold mb-2 text-sm">Analysis</div>
             <p className="text-gray-200 text-sm">
            {getAnalysisText(analysis, type)}
            </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


