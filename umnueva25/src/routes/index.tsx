import React from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import App from '../App';
import { ServicesPage } from '../pages/services';
import { CasesPage } from '../pages/cases';
import { ContactPage } from '../pages/contact';
import { AboutPage } from '../pages/about';
import { AntecedentesPage } from '../pages/antecedentes';
import { AntecedentesDetailPage } from '../pages/antecedentes-detail';

export const AppRoutes = () => {
  return (
    <Router>
      <Switch>
        <Route exact path="/" component={App} />
        <Route path="/servicios" component={ServicesPage} />
        <Route path="/casos-de-exito" component={CasesPage} />
        <Route path="/contacto" component={ContactPage} />
        <Route path="/nosotros" component={AboutPage} />
        <Route exact path="/antecedentes" component={AntecedentesPage} />
        <Route path="/antecedentes/:id" component={AntecedentesDetailPage} />
      </Switch>
    </Router>
  );
};