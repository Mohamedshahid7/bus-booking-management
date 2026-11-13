import { useState } from 'react'
import './App.css'

const API = import.meta.env.VITE_API_BASE_URL

const operatorStyles = `
.operator-page { width:min(1200px,92%); margin:55px auto 85px; }
.operator-heading { display:flex; justify-content:space-between; align-items:flex-end; gap:20px; margin-bottom:30px; }
.operator-heading h2 { font-family:Manrope,sans-serif; color:#142b35; font-size:clamp(28px,4vw,39px); letter-spacing:-1.5px; }
.operator-heading p { color:#78848a; margin-top:8px; font-size:14px; }
.operator-tabs { display:flex; flex-wrap:wrap; gap:9px; border-bottom:1px solid #e8e5dd; margin-bottom:28px; }
.operator-tab { padding:13px 19px; border:0; border-bottom:3px solid transparent; background:transparent; color:#78848a; font-weight:700; font-size:13px; cursor:pointer; }
.operator-tab.active { color:#c96b45; border-bottom-color:#c96b45; }
.operator-panel { background:white; border:1px solid #e8e5dd; border-radius:8px; padding:28px; margin-bottom:22px; }
.operator-panel h3 { color:#142b35; font-family:Manrope,sans-serif; font-size:20px; margin-bottom:7px; }
.operator-panel > p { color:#78848a; font-size:13px; margin-bottom:22px; }
.operator-stats { display:grid; grid-template-columns:repeat(auto-fit,minmax(190px,1fr)); gap:15px; margin-bottom:25px; }
.operator-stat { background:white; border:1px solid #e8e5dd; border-radius:7px; padding:23px; }
.operator-stat span { color:#78848a; font-size:12px; font-weight:700; text-transform:capitalize; }
.operator-stat strong { display:block; margin-top:12px; color:#142b35; font:800 27px Manrope,sans-serif; overflow-wrap:anywhere; }
.operator-form { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:19px; }
.operator-field { display:flex; flex-direction:column; gap:8px; }
.operator-field.full { grid-column:1/-1; }
.operator-field label { font-size:12px; font-weight:800; color:#142b35; }
.operator-field input,.operator-field select { width:100%; min-height:48px; padding:12px 14px; background:#fbfaf7; border:1px solid #e5e3dc; border-radius:4px; color:#26343a; outline:none; }
.operator-field input:focus,.operator-field select:focus { border-color:#c96b45; background:white; }
.operator-form-actions { grid-column:1/-1; display:flex; flex-wrap:wrap; gap:10px; margin-top:8px; }
.operator-secondary { padding:13px 20px; border:1px solid #d8d5cd; background:white; color:#536168; border-radius:4px; font-weight:700; cursor:pointer; }
.operator-table-wrap { overflow-x:auto; }
.operator-table { width:100%; border-collapse:collapse; min-width:750px; }
.operator-table th { padding:15px 13px; text-align:left; color:#78848a; font-size:10px; letter-spacing:1px; border-bottom:1px solid #e8e5dd; }
.operator-table td { padding:17px 13px; color:#35464d; font-size:13px; border-bottom:1px solid #f0eee9; }
.operator-table td strong { color:#142b35; }
.operator-actions { display:flex; gap:8px; }
.operator-action { padding:8px 12px; border:1px solid #e8e5dd; background:white; border-radius:4px; color:#142b35; font-size:11px; font-weight:800; cursor:pointer; }
.operator-action.edit { color:#a95b39; border-color:#ead1c5; }
.operator-action.cancel { color:#a94442; border-color:#e9cccc; }
.operator-badge { display:inline-block; padding:6px 9px; border-radius:20px; font-size:10px; font-weight:800; background:#eaf5ee; color:#26734e; }
.operator-badge.cancelled { background:#f9eeee; color:#a94442; }
.operator-badge.other { background:#faf3e4; color:#8b6726; }
.operator-empty { padding:45px 20px; text-align:center; color:#78848a; background:#fbfaf7; border:1px dashed #d9d5ca; border-radius:6px; }
.operator-empty strong { display:block; color:#142b35; font:700 19px Manrope,sans-serif; margin-bottom:8px; }
.operator-note { padding:13px 15px; background:#fbf0e9; color:#965034; border-left:3px solid #c96b45; font-size:12px; line-height:1.7; margin-bottom:20px; }
@media(max-width:650px) {
.operator-page { margin:35px auto 60px; }
.operator-heading { align-items:flex-start; flex-direction:column; }
.operator-panel { padding:20px 15px; }
.operator-form { grid-template-columns:1fr; }
.operator-field.full,.operator-form-actions { grid-column:auto; }
.operator-tabs { gap:0; }
.operator-tab { padding:12px 11px; font-size:11px; }
}
`

function App() {
    const [page, setPage] = useState('home')
    const [token, setToken] = useState(() => localStorage.getItem('token') || '')

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

    const [buses, setBuses] = useState([])
    const [routes, setRoutes] = useState([])
    const [operatorTrips, setOperatorTrips] = useState([])
    const [operatorTab, setOperatorTab] = useState('overview')
    const [editingTripId, setEditingTripId] = useState(null)

    const [tripForm, setTripForm] = useState({
        busId: '',
        routeId: '',
        departureTime: '',
        arrivalTime: '',
        fare: '',
    })

    const [message, setMessage] = useState('')
    const [loading, setLoading] = useState(false)
    const [selectedTrip, setSelectedTrip] = useState(null)
    const [selectedSeats, setSelectedSeats] = useState(1)

    const role = user?.role?.replace('ROLE_', '')

    async function apiRequest(path, options = {}, authToken = token) {
        if (!API) {
            throw new Error('API URL is missing. Check your frontend environment variable VITE_API_BASE_URL.')
        }

        const response = await fetch(`${API}${path}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
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
            throw new Error(data.message || data.error || `Request failed (${response.status})`)
        }

        return data
    }

    function updateForm(event) {
        setForm({ ...form, [event.target.name]: event.target.value })
    }

    function updateTripForm(event) {
        setTripForm({ ...tripForm, [event.target.name]: event.target.value })
    }

    async function login(event) {
        event.preventDefault()
        setLoading(true)
        setMessage('')

        try {
            const data = await apiRequest('/api/v1/auth/login', {
                method: 'POST',
                body: JSON.stringify({
                    email: form.email,
                    password: form.password,
                }),
            }, '')

            if (!data.token) {
                throw new Error('Login response did not contain an authentication token.')
            }

            const loggedInUser = {
                userId: data.userId,
                email: data.email,
                role: data.role,
            }

            localStorage.setItem('token', data.token)
            localStorage.setItem('user', JSON.stringify(loggedInUser))

            setToken(data.token)
            setUser(loggedInUser)

            setForm({ fullName: '', email: '', phone: '', password: '' })
            setMessage('Login successful!')

            const normalizedRole = data.role?.replace('ROLE_', '')

            if (normalizedRole === 'ADMIN') {
                await loadDashboard('/api/v1/admin/dashboard', data.token)
            } else if (normalizedRole === 'OPERATOR') {
                // IMPORTANT: pass the newly received token immediately.
                await loadOperator(data.token)
            } else {
                setPage('home')
            }
        } catch (error) {
            setMessage(error.message)
        } finally {
            setLoading(false)
        }
    }

    async function register(event) {
        event.preventDefault()
        setLoading(true)
        setMessage('')

        try {
            await apiRequest('/api/v1/auth/register', {
                method: 'POST',
                body: JSON.stringify(form),
            }, '')

            setMessage('Registration successful! Please log in.')
            setForm({ fullName: '', email: '', phone: '', password: '' })
            setPage('login')
        } catch (error) {
            setMessage(error.message)
        } finally {
            setLoading(false)
        }
    }

    function logout() {
        localStorage.removeItem('token')
        localStorage.removeItem('user')

        setToken('')
        setUser(null)
        setTrips([])
        setBookings([])
        setDashboard(null)
        setSelectedTrip(null)
        setBuses([])
        setRoutes([])
        setOperatorTrips([])
        setPage('home')
        setMessage('You have logged out.')
    }

    async function searchTrips(event) {
        event.preventDefault()
        setLoading(true)
        setMessage('')
        setTrips([])

        try {
            const query = new URLSearchParams({ source, destination, date })
            const data = await apiRequest(`/api/v1/trips/search?${query}`)

            setTrips(Array.isArray(data) ? data : data.content || [])
            setPage('results')
        } catch (error) {
            setMessage(error.message)
        } finally {
            setLoading(false)
        }
    }

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

    async function confirmBooking() {
        if (!selectedTrip) return

        const availableSeats = Number(selectedTrip.availableSeats)

        if (!Number.isInteger(selectedSeats) || selectedSeats < 1 || selectedSeats > availableSeats) {
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

    async function loadBookings() {
        try {
            const data = await apiRequest('/api/v1/bookings/my-bookings')
            setBookings(Array.isArray(data) ? data : data.content || [])
            setPage('bookings')
        } catch (error) {
            setMessage(error.message)
        }
    }

    async function cancelBooking(id) {
        if (!window.confirm('Are you sure you want to cancel this booking?')) return

        setLoading(true)

        try {
            await apiRequest(`/api/v1/bookings/${id}/cancel`, {
                method: 'PATCH',
            })

            setMessage('Booking cancelled successfully.')
            await loadBookings()
        } catch (error) {
            setMessage(error.message)
        } finally {
            setLoading(false)
        }
    }

    async function loadDashboard(path, authToken = token) {
        try {
            const data = await apiRequest(path, {}, authToken)
            setDashboard(data)
            setPage('dashboard')
        } catch (error) {
            setMessage(error.message)
            setPage('home')
        }
    }

    // OPERATOR MANAGEMENT

    // Accepts the new login token so the first dashboard request is authenticated.
    async function loadOperator(authToken = token) {
        setLoading(true)
        setMessage('')

        try {
            const [dashboardData, busData, routeData] = await Promise.all([
                apiRequest('/api/v1/operator/dashboard', {}, authToken),
                apiRequest('/api/v1/buses', {}, authToken),
                apiRequest('/api/v1/routes', {}, authToken),
            ])

            const allBuses = Array.isArray(busData)
                ? busData
                : busData.content || []

            const allRoutes = Array.isArray(routeData)
                ? routeData
                : routeData.content || []

            const actualOperatorId = Number(dashboardData.operatorId)

            if (!Number.isFinite(actualOperatorId)) {
                throw new Error('Operator ID was not returned by the dashboard API.')
            }

            const ownedBuses = allBuses.filter(
                bus => Number(bus.operatorId) === actualOperatorId
            )

            setDashboard(dashboardData)
            setBuses(ownedBuses)
            setRoutes(allRoutes.filter(route => route.active !== false))

            const tripResponses = await Promise.all(
                ownedBuses.map(bus =>
                    apiRequest(`/api/v1/trips/bus/${bus.id}`, {}, authToken)
                        .catch(() => [])
                )
            )

            const combinedTrips = tripResponses.flatMap(result =>
                Array.isArray(result) ? result : result.content || []
            )

            setOperatorTrips(combinedTrips)
            setOperatorTab('overview')
            setEditingTripId(null)
            setPage('operator')
        } catch (error) {
            setMessage(`Could not load operator management: ${error.message}`)
        } finally {
            setLoading(false)
        }
    }

    async function refreshOperatorData() {
        try {
            const [dashboardData, ...tripResponses] = await Promise.all([
                apiRequest('/api/v1/operator/dashboard'),
                ...buses.map(bus =>
                    apiRequest(`/api/v1/trips/bus/${bus.id}`).catch(() => [])
                ),
            ])

            setDashboard(dashboardData)

            const combinedTrips = tripResponses.flatMap(result =>
                Array.isArray(result) ? result : result.content || []
            )

            setOperatorTrips(combinedTrips)
        } catch (error) {
            setMessage(error.message)
        }
    }

    function resetTripForm() {
        setTripForm({
            busId: '',
            routeId: '',
            departureTime: '',
            arrivalTime: '',
            fare: '',
        })

        setEditingTripId(null)
    }

    function toLocalDateTime(value) {
        if (!value) return ''
        return String(value).slice(0, 16)
    }

    async function saveTrip(event) {
        event.preventDefault()
        setLoading(true)
        setMessage('')

        try {
            const payload = {
                busId: Number(tripForm.busId),
                routeId: Number(tripForm.routeId),
                departureTime: tripForm.departureTime.length === 16
                    ? `${tripForm.departureTime}:00`
                    : tripForm.departureTime,
                arrivalTime: tripForm.arrivalTime.length === 16
                    ? `${tripForm.arrivalTime}:00`
                    : tripForm.arrivalTime,
                fare: Number(tripForm.fare),
            }

            if (editingTripId) {
                await apiRequest(`/api/v1/trips/${editingTripId}`, {
                    method: 'PUT',
                    body: JSON.stringify(payload),
                })

                setMessage('Trip updated successfully.')
            } else {
                await apiRequest('/api/v1/trips', {
                    method: 'POST',
                    body: JSON.stringify(payload),
                })

                setMessage('New trip created successfully.')
            }

            resetTripForm()
            await refreshOperatorData()
            setOperatorTab('trips')
        } catch (error) {
            setMessage(error.message)
        } finally {
            setLoading(false)
        }
    }

    function startEditingTrip(trip) {
        setTripForm({
            busId: String(trip.busId || ''),
            routeId: String(trip.routeId || ''),
            departureTime: toLocalDateTime(trip.departureTime),
            arrivalTime: toLocalDateTime(trip.arrivalTime),
            fare: String(trip.fare ?? ''),
        })

        setEditingTripId(trip.id)
        setOperatorTab('add')
        setMessage('')
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    async function cancelOperatorTrip(trip) {
        if (!window.confirm(`Cancel trip #${trip.id}? This action cannot be undone.`)) return

        setLoading(true)
        setMessage('')

        try {
            await apiRequest(`/api/v1/trips/${trip.id}/cancel`, {
                method: 'PATCH',
            })

            setMessage(`Trip #${trip.id} cancelled successfully.`)
            await refreshOperatorData()
        } catch (error) {
            setMessage(error.message)
        } finally {
            setLoading(false)
        }
    }

    function formatDate(value) {
        if (!value) return 'Not available'
        return new Date(value).toLocaleString()
    }

    function goToSearch() {
        setPage('home')

        setTimeout(() => {
            document.getElementById('search')?.scrollIntoView({
                behavior: 'smooth',
            })
        }, 100)
    }

    function routeName(routeId) {
        const route = routes.find(
            item => Number(item.id) === Number(routeId)
        )

        return route
            ? `${route.source} → ${route.destination}`
            : `Route #${routeId}`
    }

    function busName(busId) {
        const bus = buses.find(
            item => Number(item.id) === Number(busId)
        )

        if (!bus) return `Bus #${busId}`

        return `${bus.busName || bus.busNumber} (${bus.busNumber})`
    }

    function tripStatusClass(status) {
        if (status === 'CANCELLED') return 'cancelled'
        if (status !== 'SCHEDULED') return 'other'
        return ''
    }

    return (
        <div className="app">
            <style>{operatorStyles}</style>

            <header className="navbar">
                <div className="brand" onClick={() => setPage('home')}>
                    <span className="brand-icon">🚌</span>
                    <span>Shahid<span className="brand-highlight">Travels</span></span>
                </div>

                <nav className="nav-menu">
                    <button className="nav-link" onClick={() => setPage('home')}>Home</button>
                    <button className="nav-link" onClick={goToSearch}>Search Buses</button>

                    {token && (
                        <>
                            {role === 'CUSTOMER' && (
                                <button className="nav-link" onClick={loadBookings}>My Bookings</button>
                            )}

                            {role === 'ADMIN' && (
                                <button className="nav-link" onClick={() => loadDashboard('/api/v1/admin/dashboard')}>Admin</button>
                            )}

                            {role === 'OPERATOR' && (
                                <button className="nav-link" onClick={() => loadOperator()}>Operator</button>
                            )}
                        </>
                    )}
                </nav>

                <div className="nav-actions">
                    {token ? (
                        <>
                            <span className="welcome">Welcome, {user?.email}</span>
                            <button className="nav-login" onClick={logout}>Logout</button>
                        </>
                    ) : (
                        <>
                            <button className="nav-login" onClick={() => { setMessage(''); setPage('login') }}>Login</button>
                            <button className="register-btn" onClick={() => { setMessage(''); setPage('register') }}>Sign Up ↗</button>
                        </>
                    )}
                </div>
            </header>

            {message && (
                <div className="message">
                    <span>{message}</span>
                    <button onClick={() => setMessage('')} aria-label="Close notification">×</button>
                </div>
            )}

            {/* HOME */}

            {page === 'home' && (
                <>
                    <section className="hero-section">
                        <div className="hero-content">
                            <span className="eyebrow">TRAVEL SMARTER. TRAVEL BETTER.</span>
                            <h1>Your Journey<br />Begins <span>Here.</span></h1>
                            <p>Discover comfortable journeys, compare buses and book your tickets easily. Your next adventure is just a few clicks away.</p>
                            <button className="hero-button" onClick={goToSearch}>Explore Buses →</button>
                        </div>

                        <div className="hero-visual">
                            <div className="floating-card">
                                <strong>Easy Booking</strong>
                                <span>Fast · Safe · Reliable</span>
                            </div>
                        </div>
                    </section>

                    <section className="search-section booking-panel" id="search">
                        <div className="booking-heading">
                            <div>
                                <span className="booking-eyebrow">PLAN YOUR NEXT JOURNEY</span>
                                <h2>Where would you like to go?</h2>
                                <p>Find your bus, choose your seat and travel with confidence.</p>
                            </div>
                            <div className="booking-heading-icon">✦</div>
                        </div>

                        <form onSubmit={searchTrips}>
                            <div className="booking-fields">
                                <div className="booking-field">
                                    <label htmlFor="source">FROM</label>
                                    <div className="booking-input">
                                        <span>⌖</span>
                                        <input id="source" value={source} onChange={e => setSource(e.target.value)} placeholder="Departure city" required />
                                    </div>
                                </div>

                                <button type="button" className="booking-swap" onClick={() => { setSource(destination); setDestination(source) }}>⇄</button>

                                <div className="booking-field">
                                    <label htmlFor="destination">TO</label>
                                    <div className="booking-input">
                                        <span>⌖</span>
                                        <input id="destination" value={destination} onChange={e => setDestination(e.target.value)} placeholder="Destination city" required />
                                    </div>
                                </div>

                                <div className="booking-field date-field">
                                    <label htmlFor="travel-date">JOURNEY DATE</label>
                                    <div className="booking-input">
                                        <span>▦</span>
                                        <input id="travel-date" type="date" value={date} min={new Date().toLocaleDateString('en-CA')} onChange={e => setDate(e.target.value)} required />
                                    </div>
                                </div>
                            </div>

                            <button className="booking-submit" type="submit" disabled={loading}>
                                {loading ? 'Finding buses...' : 'Search Buses'} <span>→</span>
                            </button>
                        </form>

                        <div className="booking-trust">
                            <span>✓ Easy booking</span>
                            <span>✓ Secure reservations</span>
                            <span>✓ Convenient travel</span>
                        </div>
                    </section>

                    <section className="features">
                        <div className="section-heading">
                            <span>WHY CHOOSE US</span>
                            <h2>Travel With Confidence</h2>
                        </div>

                        <div className="feature-grid">
                            <article className="feature-card">
                                <div>🎫</div>
                                <h3>Easy Booking</h3>
                                <p>Book your bus tickets with a simple and convenient process.</p>
                            </article>
                            <article className="feature-card">
                                <div>🔒</div>
                                <h3>Secure Accounts</h3>
                                <p>Your account and booking information are protected.</p>
                            </article>
                            <article className="feature-card">
                                <div>🚌</div>
                                <h3>Comfortable Travel</h3>
                                <p>Explore available buses and choose a journey that suits you.</p>
                            </article>
                        </div>
                    </section>
                </>
            )}

            {/* LOGIN / REGISTER */}

            {(page === 'login' || page === 'register') && (
                <section className="auth-section">
                    <form className="auth-card" onSubmit={page === 'login' ? login : register}>
                        <div className="auth-icon">🚌</div>
                        <span className="eyebrow">SHAHID TRAVELS</span>
                        <h2>{page === 'login' ? 'Welcome Back!' : 'Create Your Account'}</h2>
                        <p>{page === 'login' ? 'Log in to continue your journey.' : 'Register to start booking your journeys.'}</p>

                        {page === 'register' && (
                            <>
                                <div className="form-group">
                                    <label>Full Name</label>
                                    <input name="fullName" value={form.fullName} onChange={updateForm} placeholder="Enter your full name" required />
                                </div>
                                <div className="form-group">
                                    <label>Phone Number</label>
                                    <input name="phone" value={form.phone} onChange={updateForm} placeholder="Enter your phone number" />
                                </div>
                            </>
                        )}

                        <div className="form-group">
                            <label>Email Address</label>
                            <input type="email" name="email" value={form.email} onChange={updateForm} placeholder="Enter your email" required />
                        </div>

                        <div className="form-group">
                            <label>Password</label>
                            <input type="password" name="password" value={form.password} onChange={updateForm} placeholder="Enter your password" minLength="8" required />
                        </div>

                        <button className="primary-btn" type="submit" disabled={loading}>
                            {loading ? 'Please wait...' : page === 'login' ? 'Login to Account' : 'Create Account'}
                        </button>

                        <p className="auth-switch">
                            {page === 'login' ? "Don't have an account?" : 'Already registered?'}
                            <button type="button" onClick={() => { setMessage(''); setPage(page === 'login' ? 'register' : 'login') }}>
                                {page === 'login' ? 'Sign Up' : 'Login'}
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
                        <h2>{source} → {destination}</h2>
                        <p>Travel date: {date}</p>
                    </div>

                    {trips.length === 0 ? (
                        <div className="empty-state">
                            <div>🚌</div>
                            <h3>No buses found</h3>
                            <p>Try another route or travel date.</p>
                            <button className="primary-btn" onClick={() => setPage('home')}>Search Again</button>
                        </div>
                    ) : (
                        <div className="trip-list">
                            {trips.map(trip => (
                                <article className="trip-card" key={trip.id}>
                                    <div>
                                        <span className="trip-label">BUS JOURNEY</span>
                                        <h3>Trip #{trip.id}</h3>
                                        <p>Route ID: {trip.routeId}</p>
                                        <p>Bus ID: {trip.busId}</p>
                                    </div>

                                    <div>
                                        <span className="trip-label">DEPARTURE</span>
                                        <strong>{formatDate(trip.departureTime)}</strong>
                                        <p>Arrival: {formatDate(trip.arrivalTime)}</p>
                                    </div>

                                    <div>
                                        <span className="trip-label">FARE</span>
                                        <strong className="fare">₹{trip.fare}</strong>
                                        <p>{trip.availableSeats} seats available</p>
                                    </div>

                                    <button className="primary-btn" onClick={() => openBooking(trip)} disabled={loading || trip.status !== 'SCHEDULED' || Number(trip.availableSeats) < 1}>
                                        Book Now
                                    </button>
                                </article>
                            ))}
                        </div>
                    )}

                    <button className="back-button" onClick={() => setPage('home')}>← Back to Home</button>
                </section>
            )}

            {/* CUSTOMER BOOKINGS */}

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
                            <p>Your bookings will appear here after you book a bus.</p>
                            <button className="primary-btn" onClick={goToSearch}>Find a Bus</button>
                        </div>
                    ) : (
                        <div className="trip-list">
                            {bookings.map(booking => (
                                <article className="trip-card" key={booking.id}>
                                    <div>
                                        <span className="trip-label">BOOKING ID</span>
                                        <h3>#{booking.id}</h3>
                                        <p>Trip ID: {booking.tripId}</p>
                                    </div>

                                    <div>
                                        <span className="trip-label">SEATS</span>
                                        <strong>{booking.seatsBooked}</strong>
                                        <p>{formatDate(booking.bookingTime)}</p>
                                    </div>

                                    <div>
                                        <span className="trip-label">TOTAL FARE</span>
                                        <strong className="fare">₹{booking.totalFare}</strong>
                                        <p>Status: {booking.status}</p>
                                    </div>

                                    {booking.status === 'CONFIRMED' && (
                                        <button className="cancel-button" onClick={() => cancelBooking(booking.id)} disabled={loading}>
                                            Cancel Booking
                                        </button>
                                    )}
                                </article>
                            ))}
                        </div>
                    )}
                </section>
            )}

            {/* OPERATOR MANAGEMENT */}

            {page === 'operator' && (
                <section className="operator-page">
                    <div className="operator-heading">
                        <div>
                            <span className="section-kicker">SHAHID TRAVELS · OPERATIONS</span>
                            <h2>Operator Dashboard</h2>
                            <p>Manage your fleet, routes and scheduled journeys.</p>
                        </div>
                        <button className="primary-btn" onClick={() => { resetTripForm(); setOperatorTab('add') }}>
                            + Create New Trip
                        </button>
                    </div>

                    <div className="operator-tabs">
                        <button className={`operator-tab ${operatorTab === 'overview' ? 'active' : ''}`} onClick={() => setOperatorTab('overview')}>Overview</button>
                        <button className={`operator-tab ${operatorTab === 'trips' ? 'active' : ''}`} onClick={() => setOperatorTab('trips')}>Manage Trips</button>
                        <button className={`operator-tab ${operatorTab === 'add' ? 'active' : ''}`} onClick={() => { if (!editingTripId) resetTripForm(); setOperatorTab('add') }}>{editingTripId ? 'Edit Trip' : 'Add Trip'}</button>
                    </div>

                    {operatorTab === 'overview' && (
                        <>
                            <div className="operator-stats">
                                {Object.entries(dashboard || {})
                                    .filter(([key]) => key !== 'operatorId')
                                    .map(([key, value]) => (
                                        <article className="operator-stat" key={key}>
                                            <span>{key.replace(/([A-Z])/g, ' $1')}</span>
                                            <strong>{String(value)}</strong>
                                        </article>
                                    ))}
                            </div>

                            <div className="operator-panel">
                                <h3>Your Fleet</h3>
                                <p>Active buses registered under your operator account.</p>

                                {buses.length === 0 ? (
                                    <div className="operator-empty">
                                        <strong>No buses found</strong>
                                        No buses are currently associated with this operator account.
                                    </div>
                                ) : (
                                    <div className="operator-table-wrap">
                                        <table className="operator-table">
                                            <thead>
                                            <tr>
                                                <th>BUS</th>
                                                <th>REGISTRATION</th>
                                                <th>TYPE</th>
                                                <th>SEATS</th>
                                                <th>STATUS</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {buses.map(bus => (
                                                <tr key={bus.id}>
                                                    <td><strong>{bus.busName || bus.busNumber}</strong></td>
                                                    <td>{bus.registrationNumber || bus.busNumber}</td>
                                                    <td>{bus.busType}</td>
                                                    <td>{bus.totalSeats}</td>
                                                    <td><span className="operator-badge">{bus.active ? 'ACTIVE' : 'INACTIVE'}</span></td>
                                                </tr>
                                            ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {operatorTab === 'trips' && (
                        <div className="operator-panel">
                            <h3>Trip Management</h3>
                            <p>Review your trips and manage eligible scheduled journeys.</p>

                            {operatorTrips.length === 0 ? (
                                <div className="operator-empty">
                                    <strong>No trips created yet</strong>
                                    Create your first journey to make it available for customer booking.
                                    <br /><br />
                                    <button className="primary-btn" onClick={() => { resetTripForm(); setOperatorTab('add') }}>Create First Trip</button>
                                </div>
                            ) : (
                                <div className="operator-table-wrap">
                                    <table className="operator-table">
                                        <thead>
                                        <tr>
                                            <th>TRIP</th>
                                            <th>BUS</th>
                                            <th>ROUTE</th>
                                            <th>DEPARTURE</th>
                                            <th>FARE</th>
                                            <th>STATUS</th>
                                            <th>ACTIONS</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {operatorTrips.map(trip => (
                                            <tr key={trip.id}>
                                                <td><strong>#{trip.id}</strong></td>
                                                <td>{busName(trip.busId)}</td>
                                                <td>{routeName(trip.routeId)}</td>
                                                <td>{formatDate(trip.departureTime)}</td>
                                                <td><strong>₹{trip.fare}</strong></td>
                                                <td><span className={`operator-badge ${tripStatusClass(trip.status)}`}>{trip.status}</span></td>
                                                <td>
                                                    <div className="operator-actions">
                                                        {trip.status === 'SCHEDULED' && (
                                                            <>
                                                                <button className="operator-action edit" onClick={() => startEditingTrip(trip)}>Edit</button>
                                                                <button className="operator-action cancel" onClick={() => cancelOperatorTrip(trip)} disabled={loading}>Cancel</button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {operatorTab === 'add' && (
                        <div className="operator-panel">
                            <h3>{editingTripId ? `Edit Trip #${editingTripId}` : 'Create a New Trip'}</h3>
                            <p>Choose one of your buses, select a route and enter the journey schedule.</p>

                            <div className="operator-note">
                                Trips must have a future departure time, an arrival time after departure and a fare greater than zero. The backend prevents editing or cancelling trips that have confirmed bookings.
                            </div>

                            {buses.length === 0 || routes.length === 0 ? (
                                <div className="operator-empty">
                                    <strong>Setup required</strong>
                                    {buses.length === 0 ? 'No buses are available for your operator account.' : 'No active routes are available.'}
                                </div>
                            ) : (
                                <form className="operator-form" onSubmit={saveTrip}>
                                    {!editingTripId && (
                                        <div className="operator-field">
                                            <label htmlFor="trip-bus">SELECT BUS</label>
                                            <select id="trip-bus" name="busId" value={tripForm.busId} onChange={updateTripForm} required>
                                                <option value="">Choose your bus</option>
                                                {buses.filter(bus => bus.active).map(bus => (
                                                    <option key={bus.id} value={bus.id}>
                                                        {bus.busName || bus.busNumber} — {bus.busNumber}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    {!editingTripId && (
                                        <div className="operator-field">
                                            <label htmlFor="trip-route">SELECT ROUTE</label>
                                            <select id="trip-route" name="routeId" value={tripForm.routeId} onChange={updateTripForm} required>
                                                <option value="">Choose a route</option>
                                                {routes.map(route => (
                                                    <option key={route.id} value={route.id}>
                                                        {route.source} → {route.destination} ({route.distanceKm ?? '—'} km)
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    {editingTripId && (
                                        <div className="operator-field full">
                                            <label>BUS & ROUTE</label>
                                            <input value={`${busName(tripForm.busId)} · ${routeName(tripForm.routeId)}`} disabled />
                                        </div>
                                    )}

                                    <div className="operator-field">
                                        <label htmlFor="trip-departure">DEPARTURE DATE & TIME</label>
                                        <input id="trip-departure" type="datetime-local" name="departureTime" value={tripForm.departureTime} onChange={updateTripForm} required />
                                    </div>

                                    <div className="operator-field">
                                        <label htmlFor="trip-arrival">ARRIVAL DATE & TIME</label>
                                        <input id="trip-arrival" type="datetime-local" name="arrivalTime" value={tripForm.arrivalTime} onChange={updateTripForm} required />
                                    </div>

                                    <div className="operator-field">
                                        <label htmlFor="trip-fare">FARE PER SEAT (₹)</label>
                                        <input id="trip-fare" type="number" name="fare" value={tripForm.fare} onChange={updateTripForm} min="1" step="0.01" placeholder="Enter ticket fare" required />
                                    </div>

                                    <div className="operator-form-actions">
                                        <button className="primary-btn" type="submit" disabled={loading}>
                                            {loading ? 'Saving...' : editingTripId ? 'Save Trip Changes' : 'Create Trip'}
                                        </button>
                                        <button className="operator-secondary" type="button" onClick={() => { resetTripForm(); setOperatorTab('trips') }}>
                                            Discard
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    )}
                </section>
            )}

            {/* ADMIN DASHBOARD */}

            {page === 'dashboard' && dashboard && (
                <section className="content-section">
                    <div className="section-heading">
                        <span>MANAGEMENT OVERVIEW</span>
                        <h2>Admin Dashboard</h2>
                    </div>

                    <div className="dashboard-grid">
                        {Object.entries(dashboard).map(([key, value]) => (
                            <article className="dashboard-card" key={key}>
                                <span>{key.replace(/([A-Z])/g, ' $1')}</span>
                                <strong>{String(value)}</strong>
                            </article>
                        ))}
                    </div>
                </section>
            )}

            {/* BOOKING CONFIRMATION MODAL */}

            {selectedTrip && (
                <div
                    role="presentation"
                    onClick={event => {
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
                            background: '#fff',
                            borderRadius: '16px',
                            padding: '32px',
                            boxShadow: '0 25px 80px rgba(0,0,0,0.25)',
                            color: '#142b35',
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
                            <div>
                                <span style={{ color: '#c96b45', fontSize: '11px', fontWeight: 800, letterSpacing: '2px' }}>SHAHID TRAVELS</span>
                                <h2 id="booking-modal-title" style={{ fontFamily: 'Manrope,sans-serif', fontSize: '25px', marginTop: '7px' }}>Confirm your journey</h2>
                            </div>
                            <button type="button" onClick={() => !loading && setSelectedTrip(null)} disabled={loading} aria-label="Close booking popup" style={{ border: 'none', background: '#f3f2ee', borderRadius: '50%', width: '36px', height: '36px', fontSize: '22px', color: '#142b35' }}>×</button>
                        </div>

                        <div style={{ background: '#f7f6f2', borderRadius: '10px', padding: '18px', marginBottom: '24px' }}>
                            <div style={{ fontSize: '12px', color: '#78848a', fontWeight: 700, letterSpacing: '1px' }}>JOURNEY DETAILS</div>
                            <h3 style={{ fontSize: '20px', marginTop: '10px' }}>{source} → {destination}</h3>
                            <p style={{ fontSize: '13px', color: '#78848a', marginTop: '7px' }}>Trip #{selectedTrip.id}</p>
                            <p style={{ fontSize: '13px', color: '#78848a', marginTop: '5px' }}>{formatDate(selectedTrip.departureTime)}</p>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                            <div>
                                <strong style={{ fontSize: '15px' }}>Select seats</strong>
                                <p style={{ fontSize: '12px', color: '#78848a', marginTop: '5px' }}>{selectedTrip.availableSeats} available</p>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <button type="button" onClick={() => setSelectedSeats(current => Math.max(1, current - 1))} disabled={selectedSeats <= 1 || loading} style={{ width: '36px', height: '36px', border: '1px solid #dedbd3', background: '#fff', borderRadius: '7px', fontSize: '21px', color: '#142b35' }}>−</button>
                                <strong style={{ fontSize: '20px', minWidth: '20px', textAlign: 'center' }}>{selectedSeats}</strong>
                                <button type="button" onClick={() => setSelectedSeats(current => Math.min(Number(selectedTrip.availableSeats), current + 1))} disabled={selectedSeats >= Number(selectedTrip.availableSeats) || loading} style={{ width: '36px', height: '36px', border: 'none', background: '#142b35', borderRadius: '7px', fontSize: '21px', color: '#fff' }}>+</button>
                            </div>
                        </div>

                        <div style={{ borderTop: '1px solid #e8e5dd', paddingTop: '18px', marginTop: '18px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#78848a', fontSize: '14px', marginBottom: '12px' }}>
                                <span>Price per seat</span><span>₹{selectedTrip.fare}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#78848a', fontSize: '14px', marginBottom: '18px' }}>
                                <span>Number of seats</span><span>{selectedSeats}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 800, fontSize: '17px', marginBottom: '23px' }}>
                                <span>Total amount</span>
                                <strong style={{ fontSize: '26px', color: '#c96b45', fontFamily: 'Manrope,sans-serif' }}>₹{Number(selectedTrip.fare) * selectedSeats}</strong>
                            </div>
                        </div>

                        <button type="button" onClick={confirmBooking} disabled={loading} style={{ width: '100%', padding: '15px', border: 'none', borderRadius: '7px', background: loading ? '#9b9b9b' : '#c96b45', color: '#fff', fontSize: '14px', fontWeight: 800 }}>
                            {loading ? 'Processing booking...' : 'Confirm Booking →'}
                        </button>
                        <button type="button" onClick={() => setSelectedTrip(null)} disabled={loading} style={{ width: '100%', padding: '13px', marginTop: '9px', border: 'none', background: 'transparent', color: '#78848a', fontWeight: 700 }}>Cancel</button>
                    </div>
                </div>
            )}

            {/* FOOTER */}

            <footer className="footer">
                <div className="brand">🚌 Shahid<span className="brand-highlight">Travels</span></div>
                <p>Making every journey comfortable, convenient and memorable.</p>
                <span>© {new Date().getFullYear()} Shahid Travels. All rights reserved.</span>
            </footer>
        </div>
    )
}

export default App
