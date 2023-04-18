describe('ISIS - Data Publication Cards', () => {
  beforeEach(() => {
    cy.intercept('**/datapublications/count*').as('getDataPublicationsCount');
    cy.intercept('**/datapublications?order*').as('getDataPublicationsOrder');
    cy.login();
    cy.visit('/browseDataPublications/instrument/8/dataPublication').wait(
      ['@getDataPublicationsCount', '@getDataPublicationsOrder'],
      { timeout: 10000 }
    );
    cy.get('[aria-label="page view Display as cards"]').click();
  });

  it('should load correctly', () => {
    cy.title().should('equal', 'DataGateway DataView');
    cy.get('#datagateway-dataview').should('be.visible');

    //Default sort
    cy.contains('[role="button"]', 'desc').should('exist');
    cy.get('.MuiTableSortLabel-iconDirectionDesc').should('be.visible');
  });

  it('should be able to click a datapublication to see its landing page', () => {
    cy.get('[data-testid="card"]')
      .first()
      .contains('51')
      .click({ force: true });
    cy.location('pathname').should(
      'eq',
      '/browseStudyHierarchy/instrument/1/dataPublication/51'
    );
  });

  it('should disable the hover tool tip by pressing escape', () => {
    // The hover tool tip has a enter delay of 500ms.
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.get('[data-testid="card"]')
      .get('[data-testid="landing-datapublication-card-pid-link"]')
      .first()
      .trigger('mouseover')
      .wait(700)
      .get('[role="tooltip"]')
      .should('exist');

    cy.get('body').type('{esc}');

    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.get('[data-testid="card"]')
      .get('[data-testid="landing-datapublication-card-pid-link"]')
      .wait(700)
      .first()
      .get('[role="tooltip"]')
      .should('not.exist');
  });

  it('should have the correct url for the PID link', () => {
    cy.get('[data-testid="card"]')
      .first()
      .get('[data-testid="landing-datapublication-card-pid-link"]')
      .first()
      .then(($pid) => {
        const pid = $pid.text();

        const url = `https://doi.org/${pid}`;

        cy.get('[data-testid="card"]')
          .first()
          .get('[data-testid="landing-datapublication-card-pid-link"]')
          .first()
          .should('have.attr', 'href', url);
      });
  });

  describe('should be able to sort by', () => {
    beforeEach(() => {
      //Revert the default sort
      cy.contains('[role="button"]', 'Publication Date')
        .click()
        .wait('@getDataPublicationsOrder', { timeout: 10000 });
    });

    it('one field', () => {
      cy.contains('[role="button"]', 'Publication Date')
        .click()
        .wait('@getDataPublicationsOrder', {
          timeout: 10000,
        });
      cy.contains('[role="button"]', 'asc').should('exist');
      cy.contains('[role="button"]', 'desc').should('not.exist');
      cy.get('[data-testid="card"]').first().contains('8');

      cy.contains('[role="button"]', 'Publication Date')
        .click()
        .wait('@getDataPublicationsOrder', {
          timeout: 10000,
        });
      cy.contains('[role="button"]', 'asc').should('not.exist');
      cy.contains('[role="button"]', 'desc').should('exist');
      cy.get('[data-testid="card"]').first().contains('51');

      cy.contains('[role="button"]', 'Publication Date')
        .click()
        .wait('@getDataPublicationsOrder', {
          timeout: 10000,
        });
      cy.contains('[role="button"]', 'asc').should('not.exist');
      cy.contains('[role="button"]', 'desc').should('not.exist');
      cy.get('[data-testid="card"]').first().contains('8');
    });
  });

  describe('should be able to filter by', () => {
    beforeEach(() => {
      //Revert the default sort
      cy.contains('[role="button"]', 'Publication Date')
        .click()
        .wait('@getDataPublicationsOrder', { timeout: 10000 });
    });

    it('multiple fields', () => {
      cy.get('[data-testid="advanced-filters-link"]').click();

      cy.get('[aria-label="Filter by Data Publication ID"]')
        .first()
        .type('5')
        .wait(['@getDataPublicationsCount', '@getDataPublicationsOrder'], {
          timeout: 10000,
        });
      cy.get('[data-testid="card"]').first().contains('45');

      cy.get('[aria-label="Filter by Title"]')
        .first()
        .type('design')
        .wait(['@getStudiesCount', '@getStudiesOrder'], {
          timeout: 10000,
        });
      cy.get('[data-testid="card"]').first().contains('51');
    });
  });
});
