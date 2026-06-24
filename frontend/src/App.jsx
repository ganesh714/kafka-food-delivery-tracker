import React, { useState, useEffect } from 'react';
import './App.css';

const STATUSES = ['PLACED', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED'];

function App() {
  const [orders, setOrders] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchState = async () => {
      try {
        const response = await fetch('http://localhost:5000/state');
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        setOrders(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching state:", err);
        setError("Unable to connect to the Status Tracker API. Is it running on port 5000?");
      }
    };

    fetchState();
    const interval = setInterval(fetchState, 2000);
    return () => clearInterval(interval);
  }, []);

  const orderEntries = Object.entries(orders);
  const activeOrders = orderEntries.filter(([_, order]) => order.status !== 'DELIVERED');

  return (
    <div className="app-container">
      <header className="glass-header">
        <h1>Live Order Dashboard</h1>
        <div className="summary-panel">
          <div className="stat-box">
            <span className="stat-value">{activeOrders.length}</span>
            <span className="stat-label">Active Orders</span>
          </div>
        </div>
      </header>

      {error && <div className="error-banner">{error}</div>}

      <main className="orders-grid">
        {orderEntries.length === 0 && !error ? (
          <div className="empty-state">
            <h2>No Active Orders</h2>
            <p>Start the producer to see simulated orders arrive in real-time.</p>
          </div>
        ) : (
          orderEntries.map(([orderId, order]) => (
            <OrderCard key={orderId} order={order} />
          ))
        )}
      </main>
    </div>
  );
}

function OrderCard({ order }) {
  const { order_id, restaurant, status, items, customer_name, estimated_delivery_minutes } = order;
  const currentStepIndex = STATUSES.indexOf(status);

  return (
    <div className={`order-card ${status === 'DELIVERED' ? 'delivered' : ''}`}>
      <div className="card-header">
        <h3 className="order-id">{order_id}</h3>
        <span className={`status-badge ${status.toLowerCase()}`}>{status.replace(/_/g, ' ')}</span>
      </div>
      
      <div className="card-body">
        <div className="info-row">
          <span className="icon">🏪</span>
          <span className="text"><strong>{restaurant}</strong></span>
        </div>
        <div className="info-row">
          <span className="icon">👤</span>
          <span className="text">{customer_name}</span>
        </div>
        <div className="info-row items-row">
          <span className="icon">🍔</span>
          <span className="text">{items.join(', ')}</span>
        </div>
        <div className="info-row eta-row">
          <span className="icon">⏳</span>
          <span className="text">ETA: ~{estimated_delivery_minutes} min</span>
        </div>
      </div>

      <div className="progress-container">
        <div className="progress-track">
          {STATUSES.map((s, index) => {
            const isActive = index <= currentStepIndex;
            return (
              <React.Fragment key={s}>
                <div className={`progress-step ${isActive ? 'active' : ''}`}>
                  <div className="step-circle" />
                  <span className="step-label">{s.replace(/_/g, ' ')}</span>
                </div>
                {index < STATUSES.length - 1 && (
                  <div className={`progress-line ${index < currentStepIndex ? 'active' : ''}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default App;
