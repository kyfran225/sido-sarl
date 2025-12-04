describe('Dashboard', () => {
  beforeEach(() => {
    // Mock login
    cy.window().then((win) => {
      win.localStorage.setItem('accessToken', 'mock-token')
      win.localStorage.setItem('user', JSON.stringify({
        id: 'user-123',
        username: 'admin',
        role: 'admin_sido'
      }))
    })
    cy.visit('/')
  })

  it('should display dashboard with key metrics', () => {
    // Mock dashboard stats
    cy.intercept('GET', '**/dashboard-stats', {
      statusCode: 200,
      body: {
        totalTransactions: 1250,
        todayTransactions: 45,
        totalClients: 320,
        activeClients: 280,
        totalRevenue: 2500000
      }
    }).as('dashboardStats')

    cy.get('h1').should('contain', 'Tableau de Bord')

    // Check stat cards
    cy.get('.bg-white').should('have.length.at.least', 4)
    cy.contains('Transactions Aujourd\'hui').should('be.visible')
    cy.contains('Total Transactions').should('be.visible')
    cy.contains('Clients Actifs').should('be.visible')
    cy.contains('Revenus Aujourd\'hui').should('be.visible')
  })

  it('should display recent transactions table', () => {
    cy.intercept('GET', '**/transactions?limit=10', {
      statusCode: 200,
      body: {
        data: [
          {
            _id: 'txn-1',
            clientSid: 'SIDO-001-000001',
            amountFCFA: 1500,
            litres: 15,
            pointsAwarded: 15,
            serverTimestamp: new Date().toISOString()
          }
        ]
      }
    }).as('recentTransactions')

    cy.contains('Transactions Récentes').should('be.visible')
    cy.wait('@recentTransactions')
  })

  it('should navigate to different sections', () => {
    cy.get('nav').within(() => {
      cy.contains('Clients').click()
      cy.url().should('include', '/clients')
    })

    cy.get('nav').within(() => {
      cy.contains('Transactions').click()
      cy.url().should('include', '/transactions')
    })

    cy.get('nav').within(() => {
      cy.contains('Rapports').click()
      cy.url().should('include', '/reports')
    })
  })
})
