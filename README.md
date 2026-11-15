\# 🚌 Bus Booking Management System



A full-stack bus ticket reservation and management platform built using React, Java Spring Boot, and PostgreSQL.



\*\*Live Application:\*\* https://bus-booking-frontend-yhcq.onrender.com



\*\*Backend API:\*\* https://bus-booking-backend-1rzi.onrender.com



\## Overview



The Bus Booking Management System provides an online platform for customers to search buses, book seats, and manage reservations. It also provides dedicated dashboards for bus operators and administrators.



\## Features



\### Customer

\- User registration and login.

\- Search buses by source, destination, and journey date.

\- View available trips and seats.

\- Book bus tickets.

\- View booking history.

\- Cancel confirmed bookings.



\### Operator

\- Operator authentication.

\- Operator dashboard with business statistics.

\- Manage buses.

\- Create and manage trips.

\- Edit and cancel eligible trips.

\- View booking and revenue statistics.



\### Administrator

\- Secure administrator login.

\- Admin dashboard.

\- View user and customer statistics.

\- Monitor operators, buses, and trips.

\- View booking statistics and revenue.



\## Technology Stack



\*\*Frontend\*\*

\- React

\- JavaScript

\- CSS

\- Vite



\*\*Backend\*\*

\- Java 21

\- Spring Boot 4

\- Spring Security

\- Spring Data JPA

\- JWT Authentication

\- Maven



\*\*Database\*\*

\- PostgreSQL

\- Hibernate

\- Flyway Database Migrations



\*\*Deployment\*\*

\- Render

\- GitHub



\## Architecture



```text

Customer / Operator / Admin

&#x20;            |

&#x20;            v

&#x20;     React Frontend

&#x20;            |

&#x20;         REST API

&#x20;            |

&#x20;            v

&#x20;   Spring Boot Backend

&#x20;            |

&#x20;     Spring Security

&#x20;            |

&#x20;       Service Layer

&#x20;            |

&#x20;      JPA Repositories

&#x20;            |

&#x20;            v

&#x20;      PostgreSQL

```



\## Project Structure



```text

BUS BOOKING MANAGEMENT/

│

├── backend/

│   ├── src/

│   │   └── main/

│   │       ├── java/

│   │       └── resources/

│   ├── frontend/

│   │   ├── src/

│   │   ├── public/

│   │   └── package.json

│   ├── pom.xml

│   ├── Dockerfile

│   └── README.md

```



\## Local Installation



\### Prerequisites



\- Java JDK 21

\- Maven

\- Node.js and npm

\- PostgreSQL



\### Backend Setup



1\. Clone the repository.



```bash

git clone https://github.com/Mohamedshahid7/bus-booking-management.git

cd bus-booking-management

```



2\. Configure your PostgreSQL database and application properties.



3\. Configure the required environment variables:



```text

DB\_PASSWORD=your\_database\_password

JWT\_SECRET=your\_secure\_jwt\_secret

```



Never commit real passwords or JWT secrets to GitHub.



4\. Start the backend:



```bash

mvn spring-boot:run

```



The backend runs on port 8080 by default.



\### Frontend Setup



Open another terminal:



```bash

cd frontend

npm install

npm run dev

```



Open the local URL displayed by Vite.



\## Security



\- JWT-based authentication.

\- Password hashing using BCrypt.

\- Role-based access for customers, operators, and administrators.

\- Protected backend endpoints.

\- Authorization checks for booking operations.



\## Deployment



The application is deployed using Render.



\- Frontend: https://bus-booking-frontend-yhcq.onrender.com

\- Backend: https://bus-booking-backend-1rzi.onrender.com



\## Author



\*\*Mohamed Shahid A.\*\*



Computer Science and Engineering



\## Project Purpose



This project was developed to demonstrate full-stack web development, REST API design, database integration, authentication, authorization, booking workflows, and cloud deployment.

