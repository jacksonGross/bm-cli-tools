'use babel';

import { allowUnsafeNewFunction } from 'loophole';
import _ from 'underscore-plus';

export default class Form {
  constructor(serializedState, options) {
    var tpl = allowUnsafeNewFunction(() => _.template(`
      <form class="bm-cli-tools form-horizontal native-key-bindings">
        <h2><%= title %></h2>
        <% _.each(fields, function eachField(field, index) { %>
          <div class="form-group">
            <div class="col-sm-10">
              <% if (field.type === 'select') { %>
                <select id="<%= field.name %>" class="form-control" <%= index === 0 ? 'autofocus': '' %> >
                  <% _.each(field.options, function eachOption(value) { %>
                    <option><%= value %></option>
                  <% }); %>
                </select>
              <% } else { %>
                <input type="<%= field.type %>" class="form-control" id="<%= field.name %>" placeholder="<%= field.label %>" <%= index === 0 ? 'autofocus': '' %> >
              <% } %>
            </div>
          </div>
        <% }); %>

        <% _.each(buttons, function eachButton(btn) { %>
            <button class="btn btn-default bm-<%= btn.name %>"><%= btn.label %></button>
        <% }); %>
      </form>
      `
    ));

    const html = tpl(options);
    this.element = document.createElement('div');
    this.element.innerHTML = html;

    options.fields.forEach((field) => {
      const el = this.element.querySelector(`#${field.name}`);
      el.addEventListener('keyup', (e) => {
        if (e.keyCode === 13) {
          field.action();
        } else if (e.keyCode === 27) {
          options.close();
        }
      });
    });

    options.buttons.forEach((btn) => {
      const el = this.element.querySelector(`.bm-${btn.name}`);
      el.addEventListener('click', btn.action);
    });
  }

  // Returns an object that can be retrieved when package is activated
  serialize() {}

  // Tear down any state and detach
  destroy() {
    this.element.remove();
  }

  getElement() {
    return this.element;
  }
}
