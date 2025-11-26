import React from "react";
import { I18nProvider } from "@osd/i18n/react";
import { BrowserRouter as Router } from "react-router-dom";

import { CoreStart } from "../../../../src/core/public";
import { NavigationPublicPluginStart } from "../../../../src/plugins/navigation/public";

import { TodoApp } from "./todo_app";
import { TodoProvider } from "../stores";

interface CustomPluginAppDeps {
  basename: string;
  notifications: CoreStart["notifications"];
  http: CoreStart["http"];
  navigation: NavigationPublicPluginStart;
}

export const CustomPluginApp = ({
  basename,
  notifications,
  http,
  navigation,
}: CustomPluginAppDeps) => {
  return (
    <Router basename={basename}>
      <I18nProvider>
        <TodoProvider>
          <TodoApp
            basename={basename}
            notifications={notifications}
            http={http}
            navigation={navigation}
          />
        </TodoProvider>
      </I18nProvider>
    </Router>
  );
};
