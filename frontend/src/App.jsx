
import { useState } from 'react'
import './App.css'

const API = import.meta.env.VITE_API_BASE_URL

function App() {
  const [page, setPage] = useState('home')

  const [token, setToken] = useState(
    () => localStorage.getItem('token') || ''
  )

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user')) || null
    } catch {
      return null
    }
  })

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
  })

  const [source, setSource] = useState('Chennai')
  const [destination, setDestination] = useState('Vellore')
  const [date, setDate] = useState('')

  const [trips, setTrips] = useState([])
  const [bookings, setBookings] = useState([])
  const [dashboard, setDashboard] = useState(null)

  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const [selectedTrip, setSelectedTrip] = useState(null)
  const [selectedSeats, setSelectedSeats] = useState(1)

  const role = user?.role?.replace('ROLE_', '')

  // API REQUEST

  async function apiRequest(path, options = {}, authToken = token) {
    if (!API) {
      throw new Error('API URL is missing. Check your frontend .env file.')
    }

    const response = await fetch(`${API}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(authToken
          ? { Authorization: `Bearer ${authToken}` }
          : {}),
        ...options.headers,
      },
    })

    const responseText = await response.text()

    let data = {}

    try {
      data = responseText ? JSON.parse(responseText) : {}
    } catch {
      data = { message: responseText }
    }

    if (!response.ok) {
      throw new Error(
        data.message ||
        data.error ||
        `Request failed (${response.status})`
      )
    }

    return data
  }

  // FORM HANDLING

  function updateForm(event) {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    })
  }

  // LOGIN

  async function login(event) {
    event.preventDefault()

    setLoading(true)
    setMessage('')

    try {
      const data = await apiRequest(
        '/api/v1/auth/login',
        {
          method: 'POST',
          body: JSON.stringify({
            email: form.email,
            password: form.password,
          }),
        },
        ''
      )

      const newToken = data.token

      if (!newToken) {
        throw new Error(
          'Login response did not contain an authentication token.'
        )
      }

      const loggedInUser = {
        userId: data.userId,
        email: data.email,
        role: data.role,
      }

      localStorage.setItem('token', newToken)
      localStorage.setItem('user', JSON.stringify(loggedInUser))

      setToken(newToken)
      setUser(loggedInUser)

      setForm({
        fullName: '',
        email: '',
        phone: '',
        password: '',
      })

      setMessage('Login successful!')

      const normalizedRole = data.role?.replace('ROLE_', '')

      if (normalizedRole === 'ADMIN') {
        await loadDashboard('/api/v1/admin/dashboard', newToken)
      } else if (normalizedRole === 'OPERATOR') {
        await loadDashboard('/api/v1/operator/dashboard', newToken)
      } else {
        setPage('home')
      }

    } catch (error) {
      setMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  // REGISTER

  async function register(event) {
    event.preventDefault()

    setLoading(true)
    setMessage('')

    try {
      await apiRequest(
        '/api/v1/auth/register',
        {
          method: 'POST',
          body: JSON.stringify(form),
        },
        ''
      )

      setMessage('Registration successful! Please log in.')

      setForm({
        fullName: '',
        email: '',
        phone: '',
        password: '',
      })

      setPage('login')

    } catch (error) {
      setMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  // LOGOUT

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')

    setToken('')
    setUser(null)

    setTrips([])
    setBookings([])
    setDashboard(null)
    setSelectedTrip(null)

    setPage('home')
    setMessage('You have logged out.')
  }

  // SEARCH TRIPS

  async function searchTrips(event) {
    event.preventDefault()

    setLoading(true)
    setMessage('')
    setTrips([])

    try {
      const query = new URLSearchParams({
        source,
        destination,
        date,
      })

      const data = await apiRequest(
        `/api/v1/trips/search?${query}`
      )

      setTrips(
        Array.isArray(data)
          ? data
          : data.content || []
      )

      setPage('results')

    } catch (error) {
      setMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  // OPEN BOOKING POPUP

  function openBooking(trip) {
    if (!token) {
      setMessage('Please log in before booking.')
      setPage('login')
      return
    }

    setSelectedTrip(trip)
    setSelectedSeats(1)
    setMessage('')
  }

  // CONFIRM BOOKING

  async function confirmBooking() {
    if (!selectedTrip) return

    const availableSeats = Number(selectedTrip.availableSeats)

    if (
      !Number.isInteger(selectedSeats) ||
      selectedSeats < 1 ||
      selectedSeats > availableSeats
    ) {
      setMessage('Please select a valid number of seats.')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      await apiRequest('/api/v1/bookings', {
        method: 'POST',
        body: JSON.stringify({
          tripId: Number(selectedTrip.id),
          seatsBooked: selectedSeats,
        }),
      })

      setSelectedTrip(null)
      setSelectedSeats(1)

      setMessage('Booking successful! Your seats are confirmed.')

      await loadBookings()

    } catch (error) {
      setMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  // LOAD BOOKINGS

  async function loadBookings() {
    try {
      const data = await apiRequest(
        '/api/v1/bookings/my-bookings'
      )

      setBookings(
        Array.isArray(data)
          ? data
          : data.content || []
      )

      setPage('bookings')

    } catch (error) {
      setMessage(error.message)
    }
  }

  // CANCEL BOOKING

  async function cancelBooking(id) {
    if (
      !window.confirm(
        'Are you sure you want to cancel this booking?'
      )
    ) {
      return
    }

    setLoading(true)

    try {
      await apiRequest(
        `/api/v1/bookings/${id}/cancel`,
{ method: 'PATCH' }
)

setMessage('Booking cancelled successfully.')

await loadBookings()

} catch (error) {
  setMessage(error.message)
} finally {
  setLoading(false)
}
}

// DASHBOARD

async function loadDashboard(path, authToken = token) {
  try {
    const data = await apiRequest(
        path,
        {},
        authToken
    )

    setDashboard(data)
    setPage('dashboard')

  } catch (error) {
    setMessage(error.message)
    setPage('home')
  }
}

// DATE FORMATTING

function formatDate(value) {
  if (!value) return 'Not available'

  return new Date(value).toLocaleString()
}

// SCROLL TO SEARCH

function goToSearch() {
  setPage('home')

  setTimeout(() => {
    document
        .getElementById('search')
        ?.scrollIntoView({ behavior: 'smooth' })
  }, 100)
}

// NAVIGATION

return (
    <div className="app">

      <header className="navbar">

        <div
            className="brand"
            onClick={() => setPage('home')}
        >
          <span className="brand-icon">🚌</span>

          <span>
            Shahid
            <span className="brand-highlight">
              Travels
            </span>
          </span>
        </div>

        <nav className="nav-menu">

          <button
              className="nav-link"
              onClick={() => setPage('home')}
          >
            Home
          </button>

          <button
              className="nav-link"
              onClick={goToSearch}
          >
            Search Buses
          </button>

          {token && (
              <>
                <button
                    className="nav-link"
                    onClick={loadBookings}
                >
                  My Bookings
                </button>

                {role === 'ADMIN' && (
                    <button
                        className="nav-link"
                        onClick={() =>
                            loadDashboard('/api/v1/admin/dashboard')
                        }
                    >
                      Admin
                    </button>
                )}

                {role === 'OPERATOR' && (
                    <button
                        className="nav-link"
                        onClick={() =>
                            loadDashboard('/api/v1/operator/dashboard')
                        }
                    >
                      Operator
                    </button>
                )}
              </>
          )}

        </nav>

        <div className="nav-actions">

          {token ? (
              <>
              <span className="welcome">
                Welcome, {user?.email}
              </span>

                <button
                    className="nav-login"
                    onClick={logout}
                >
                  Logout
                </button>
              </>
          ) : (
              <>
                <button
                    className="nav-login"
                    onClick={() => {
                      setMessage('')
                      setPage('login')
                    }}
                >
                  Login
                </button>

                <button
                    className="register-btn"
                    onClick={() => {
                      setMessage('')
                      setPage('register')
                    }}
                >
                  Sign Up <span>↗</span>
                </button>
              </>
          )}

        </div>

      </header>

      {/* NOTIFICATION */}

      {message && (
          <div className="message">
            <span>{message}</span>

            <button
                onClick={() => setMessage('')}
                aria-label="Close notification"
            >
              ×
            </button>
          </div>
      )}

      {/* HOME PAGE */}

      {page === 'home' && (
          <>

            <section className="hero-section">

              <div className="hero-content">

              <span className="eyebrow">
                TRAVEL SMARTER. TRAVEL BETTER.
              </span>

                <h1>
                  Your Journey
                  <br />
                  Begins <span>Here.</span>
                </h1>

                <p>
                  Discover comfortable journeys, compare buses
                  and book your tickets easily. Your next
                  adventure is just a few clicks away.
                </p>

                <button
                    className="hero-button"
                    onClick={goToSearch}
                >
                  Explore Buses →
                </button>

              </div>

              <div className="hero-visual">

                <div className="hero-circle">
                  🚌
                </div>

                <div className="floating-card">
                  <strong>Easy Booking</strong>
                  <span>Fast · Safe · Reliable</span>
                </div>

              </div>

            </section>

            {/* PREMIUM BOOKING SEARCH */}

            <section
                className="search-section booking-panel"
                id="search"
            >

              <div className="booking-heading">

                <div>
                <span className="booking-eyebrow">
                  PLAN YOUR NEXT JOURNEY
                </span>

                  <h2>Where would you like to go?</h2>

                  <p>
                    Find your bus, choose your seat and travel
                    with confidence.
                  </p>
                </div>

                <div className="booking-heading-icon">
                  ✦
                </div>

              </div>

              <form
                  className="booking-search-form"
                  onSubmit={searchTrips}
              >

                <div className="booking-fields">

                  <div className="booking-field">

                    <label htmlFor="source">
                      FROM
                    </label>

                    <div className="booking-input">
                      <span>⌖</span>

                      <input
                          id="source"
                          value={source}
                          onChange={(e) =>
                              setSource(e.target.value)
                          }
                          placeholder="Departure city"
                          required
                      />
                    </div>

                  </div>

                  <button
                      type="button"
                      className="booking-swap"
                      aria-label="Swap departure and destination"
                      onClick={() => {
                        setSource(destination)
                        setDestination(source)
                      }}
                  >
                    ⇄
                  </button>

                  <div className="booking-field">

                    <label htmlFor="destination">
                      TO
                    </label>

                    <div className="booking-input">
                      <span>⌖</span>

                      <input
                          id="destination"
                          value={destination}
                          onChange={(e) =>
                              setDestination(e.target.value)
                          }
                          placeholder="Destination city"
                          required
                      />
                    </div>

                  </div>

                  <div className="booking-field date-field">

                    <label htmlFor="travel-date">
                      JOURNEY DATE
                    </label>

                    <div className="booking-input">
                      <span>▦</span>

                      <input
                          id="travel-date"
                          type="date"
                          value={date}
                          min={new Date().toLocaleDateString('en-CA')}
                          onChange={(e) =>
                              setDate(e.target.value)
                          }
                          required
                      />
                    </div>

                  </div>

                </div>

                <button
                    className="booking-submit"
                    type="submit"
                    disabled={loading}
                >
                  {loading ? 'Finding buses...' : 'Search Buses'}
                  <span>→</span>
                </button>

              </form>

              <div className="booking-trust">
                <span>✓ Easy booking</span>
                <span>✓ Secure reservations</span>
                <span>✓ Convenient travel</span>
              </div>

            </section>

            {/* FEATURES */}

            <section className="features">

              <div className="section-heading">

                <span>WHY CHOOSE US</span>

                <h2>Travel With Confidence</h2>

              </div>

              <div className="feature-grid">

                <article className="feature-card">
                  <div>🎫</div>
                  <h3>Easy Booking</h3>
                  <p>
                    Book your bus tickets with a simple
                    and convenient process.
                  </p>
                </article>

                <article className="feature-card">
                  <div>🔒</div>
                  <h3>Secure Accounts</h3>
                  <p>
                    Your account and booking information
                    are protected.
                  </p>
                </article>

                <article className="feature-card">
                  <div>🚌</div>
                  <h3>Comfortable Travel</h3>
                  <p>
                    Explore available buses and choose
                    a journey that suits you.
                  </p>
                </article>

              </div>

            </section>

          </>
      )}

      {/* LOGIN AND REGISTER */}

      {(page === 'login' || page === 'register') && (

          <section className="auth-section">

            <form
                className="auth-card"
                onSubmit={
                  page === 'login'
                      ? login
                      : register
                }
            >

              <div className="auth-icon">
                🚌
              </div>

              <span className="eyebrow">
              SHAHID TRAVELS
            </span>

              <h2>
                {page === 'login'
                    ? 'Welcome Back!'
                    : 'Create Your Account'}
              </h2>

              <p>
                {page === 'login'
                    ? 'Log in to continue your journey.'
                    : 'Register to start booking your journeys.'}
              </p>

              {page === 'register' && (
                  <>

                    <div className="form-group">
                      <label>Full Name</label>
                      <input
                          name="fullName"
                          value={form.fullName}
                          onChange={updateForm}
                          placeholder="Enter your full name"
                          required
                      />
                    </div>

                    <div className="form-group">
                      <label>Phone Number</label>
                      <input
                          name="phone"
                          value={form.phone}
                          onChange={updateForm}
                          placeholder="Enter your phone number"
                      />
                    </div>

                  </>
              )}

              <div className="form-group">
                <label>Email Address</label>
                <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={updateForm}
                    placeholder="Enter your email"
                    required
                />
              </div>

              <div className="form-group">
                <label>Password</label>
                <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={updateForm}
                    placeholder="Enter your password"
                    minLength="8"
                    required
                />
              </div>

              <button
                  className="primary-btn"
                  type="submit"
                  disabled={loading}
              >
                {loading
                    ? 'Please wait...'
                    : page === 'login'
                        ? 'Login to Account'
                        : 'Create Account'}
              </button>

              <p className="auth-switch">

                {page === 'login'
                    ? "Don't have an account?"
                    : 'Already registered?'}

                <button
                    type="button"
                    onClick={() => {
                      setMessage('')

                      setPage(
                          page === 'login'
                              ? 'register'
                              : 'login'
                      )
                    }}
                >
                  {page === 'login'
                      ? 'Sign Up'
                      : 'Login'}
                </button>

              </p>

            </form>

          </section>

      )}

      {/* SEARCH RESULTS */}

      {page === 'results' && (

          <section className="content-section">

            <div className="section-heading">

              <span>AVAILABLE JOURNEYS</span>

              <h2>
                {source} → {destination}
              </h2>

              <p>Travel date: {date}</p>

            </div>

            {trips.length === 0 ? (

                <div className="empty-state">

                  <div>🚌</div>

                  <h3>No buses found</h3>

                  <p>
                    Try another route or travel date.
                  </p>

                  <button
                      className="primary-btn"
                      onClick={() => setPage('home')}
                  >
                    Search Again
                  </button>

                </div>

            ) : (

                <div className="trip-list">

                  {trips.map((trip) => (

                      <article
                          className="trip-card"
                          key={trip.id}
                      >

                        <div>

                    <span className="trip-label">
                      BUS JOURNEY
                    </span>

                          <h3>Trip #{trip.id}</h3>

                          <p>Route ID: {trip.routeId}</p>

                          <p>Bus ID: {trip.busId}</p>

                        </div>

                        <div>

                    <span className="trip-label">
                      DEPARTURE
                    </span>

                          <strong>
                            {formatDate(trip.departureTime)}
                          </strong>

                          <p>
                            Arrival: {formatDate(trip.arrivalTime)}
                          </p>

                        </div>

                        <div>

                    <span className="trip-label">
                      FARE
                    </span>

                          <strong className="fare">
                            ₹{trip.fare}
                          </strong>

                          <p>
                            {trip.availableSeats} seats available
                          </p>

                        </div>

                        <button
                            className="primary-btn"
                            onClick={() => openBooking(trip)}
                            disabled={
                                loading ||
                                trip.status !== 'SCHEDULED' ||
                                Number(trip.availableSeats) < 1
                            }
                        >
                          Book Now
                        </button>

                      </article>

                  ))}

                </div>

            )}

            <button
                className="back-button"
                onClick={() => setPage('home')}
            >
              ← Back to Home
            </button>

          </section>

      )}

      {/* MY BOOKINGS */}

      {page === 'bookings' && (

          <section className="content-section">

            <div className="section-heading">

              <span>YOUR TRAVEL HISTORY</span>

              <h2>My Bookings</h2>

            </div>

            {bookings.length === 0 ? (

                <div className="empty-state">

                  <div>🎫</div>

                  <h3>No bookings yet</h3>

                  <p>
                    Your bookings will appear here
                    after you book a bus.
                  </p>

                  <button
                      className="primary-btn"
                      onClick={goToSearch}
                  >
                    Find a Bus
                  </button>

                </div>

            ) : (

                <div className="trip-list">

                  {bookings.map((booking) => (

                      <article
                          className="trip-card"
                          key={booking.id}
                      >

                        <div>

                    <span className="trip-label">
                      BOOKING ID
                    </span>

                          <h3>#{booking.id}</h3>

                          <p>Trip ID: {booking.tripId}</p>

                        </div>

                        <div>

                    <span className="trip-label">
                      SEATS
                    </span>

                          <strong>
                            {booking.seatsBooked}
                          </strong>

                          <p>
                            {formatDate(booking.bookingTime)}
                          </p>

                        </div>

                        <div>

                    <span className="trip-label">
                      TOTAL FARE
                    </span>

                          <strong className="fare">
                            ₹{booking.totalFare}
                          </strong>

                          <p>Status: {booking.status}</p>

                        </div>

                        {booking.status === 'CONFIRMED' && (

                            <button
                                className="cancel-button"
                                onClick={() =>
                                    cancelBooking(booking.id)
                                }
                                disabled={loading}
                            >
                              Cancel Booking
                            </button>

                        )}

                      </article>

                  ))}

                </div>

            )}

          </section>

      )}

      {/* ADMIN AND OPERATOR DASHBOARD */}

      {page === 'dashboard' && dashboard && (

          <section className="content-section">

            <div className="section-heading">

              <span>MANAGEMENT OVERVIEW</span>

              <h2>
                {role === 'ADMIN'
                    ? 'Admin Dashboard'
                    : 'Operator Dashboard'}
              </h2>

            </div>

            <div className="dashboard-grid">

              {Object.entries(dashboard).map(
                  ([key, value]) => (

                      <article
                          className="dashboard-card"
                          key={key}
                      >

                  <span>
                    {key.replace(/([A-Z])/g, ' $1')}
                  </span>

                        <strong>
                          {String(value)}
                        </strong>

                      </article>

                  )
              )}

            </div>

          </section>

      )}

      {/* BOOKING CONFIRMATION MODAL */}

      {selectedTrip && (

          <div
              role="presentation"
              onClick={(event) => {
                if (event.target === event.currentTarget && !loading) {
                  setSelectedTrip(null)
                }
              }}
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 1000,
                background: 'rgba(10, 25, 32, 0.72)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
                backdropFilter: 'blur(5px)',
              }}
          >

            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="booking-modal-title"
                style={{
                  width: '100%',
                  maxWidth: '460px',
                  background: '#ffffff',
                  borderRadius: '16px',
                  padding: '32px',
                  boxShadow: '0 25px 80px rgba(0,0,0,0.25)',
                  color: '#142b35',
                }}
            >

              <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '22px',
                  }}
              >

                <div>
                <span
                    style={{
                      color: '#c96b45',
                      fontSize: '11px',
                      fontWeight: 800,
                      letterSpacing: '2px',
                    }}
                >
                  SHAHID TRAVELS
                </span>

                  <h2
                      id="booking-modal-title"
                      style={{
                        fontFamily: 'Manrope, sans-serif',
                        fontSize: '25px',
                        marginTop: '7px',
                      }}
                  >
                    Confirm your journey
                  </h2>
                </div>

                <button
                    type="button"
                    onClick={() => {
                      if (!loading) setSelectedTrip(null)
                    }}
                    disabled={loading}
                    aria-label="Close booking popup"
                    style={{
                      border: 'none',
                      background: '#f3f2ee',
                      borderRadius: '50%',
                      width: '36px',
                      height: '36px',
                      fontSize: '22px',
                      color: '#142b35',
                    }}
                >
                  ×
                </button>

              </div>

              <div
                  style={{
                    background: '#f7f6f2',
                    borderRadius: '10px',
                    padding: '18px',
                    marginBottom: '24px',
                  }}
              >

                <div
                    style={{
                      fontSize: '12px',
                      color: '#78848a',
                      fontWeight: 700,
                      letterSpacing: '1px',
                    }}
                >
                  JOURNEY DETAILS
                </div>

                <h3
                    style={{
                      fontSize: '20px',
                      marginTop: '10px',
                    }}
                >
                  {source} → {destination}
                </h3>

                <p
                    style={{
                      fontSize: '13px',
                      color: '#78848a',
                      marginTop: '7px',
                    }}
                >
                  Trip #{selectedTrip.id}
                </p>

                <p
                    style={{
                      fontSize: '13px',
                      color: '#78848a',
                      marginTop: '5px',
                    }}
                >
                  {formatDate(selectedTrip.departureTime)}
                </p>

              </div>

              <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '18px',
                  }}
              >

                <div>
                  <strong style={{ fontSize: '15px' }}>
                    Select seats
                  </strong>

                  <p
                      style={{
                        fontSize: '12px',
                        color: '#78848a',
                        marginTop: '5px',
                      }}
                  >
                    {selectedTrip.availableSeats} available
                  </p>
                </div>

                <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                    }}
                >

                  <button
                      type="button"
                      onClick={() =>
                          setSelectedSeats((current) =>
                              Math.max(1, current - 1)
                          )
                      }
                      disabled={selectedSeats <= 1 || loading}
                      style={{
                        width: '36px',
                        height: '36px',
                        border: '1px solid #dedbd3',
                        background: '#fff',
                        borderRadius: '7px',
                        fontSize: '21px',
                        color: '#142b35',
                      }}
                  >
                    −
                  </button>

                  <strong
                      style={{
                        fontSize: '20px',
                        minWidth: '20px',
                        textAlign: 'center',
                      }}
                  >
                    {selectedSeats}
                  </strong>

                  <button
                      type="button"
                      onClick={() =>
                          setSelectedSeats((current) =>
                              Math.min(
                                  Number(selectedTrip.availableSeats),
                                  current + 1
                              )
                          )
                      }
                      disabled={
                          selectedSeats >= Number(selectedTrip.availableSeats) ||
                          loading
                      }
                      style={{
                        width: '36px',
                        height: '36px',
                        border: 'none',
                        background: '#142b35',
                        borderRadius: '7px',
                        fontSize: '21px',
                        color: '#fff',
                      }}
                  >
                    +
                  </button>

                </div>

              </div>

              <div
                  style={{
                    borderTop: '1px solid #e8e5dd',
                    paddingTop: '18px',
                    marginTop: '18px',
                  }}
              >

                <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      color: '#78848a',
                      fontSize: '14px',
                      marginBottom: '12px',
                    }}
                >
                  <span>Price per seat</span>
                  <span>₹{selectedTrip.fare}</span>
                </div>

                <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      color: '#78848a',
                      fontSize: '14px',
                      marginBottom: '18px',
                    }}
                >
                  <span>Number of seats</span>
                  <span>{selectedSeats}</span>
                </div>

                <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontWeight: 800,
                      fontSize: '17px',
                      marginBottom: '23px',
                    }}
                >
                  <span>Total amount</span>

                  <strong
                      style={{
                        fontSize: '26px',
                        color: '#c96b45',
                        fontFamily: 'Manrope, sans-serif',
                      }}
                  >
                    ₹{Number(selectedTrip.fare) * selectedSeats}
                  </strong>
                </div>

              </div>

              <button
                  type="button"
                  onClick={confirmBooking}
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '15px',
                    border: 'none',
                    borderRadius: '7px',
                    background: loading ? '#9b9b9b' : '#c96b45',
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: 800,
                    cursor: loading ? 'not-allowed' : 'pointer',
                  }}
              >
                {loading
                    ? 'Processing booking...'
                    : 'Confirm Booking →'}
              </button>

              <button
                  type="button"
                  onClick={() => setSelectedTrip(null)}
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '13px',
                    marginTop: '9px',
                    border: 'none',
                    background: 'transparent',
                    color: '#78848a',
                    fontWeight: 700,
                  }}
              >
                Cancel
              </button>

            </div>

          </div>

      )}

      {/* FOOTER */}

      <footer className="footer">

        <div className="brand">
          🚌 Shahid
          <span className="brand-highlight">
            Travels
          </span>
        </div>

        <p>
          Making every journey comfortable,
          convenient and memorable.
        </p>

        <span>
          © {new Date().getFullYear()}
          {' '}Shahid Travels. All rights reserved.
        </span>

      </footer>

    </div>
)
}

export default App
