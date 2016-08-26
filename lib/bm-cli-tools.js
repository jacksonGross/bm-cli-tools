'use babel';

import Form from './form';
import { CompositeDisposable } from 'atom';
import { spawn } from 'child_process';

export default {
  form: null,
  modalPanel: null,
  subscriptions: null,
  state: null,

  activate(state) {
    this.state = state;

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register commands for package
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'bm-cli-tools:scope': () => this.setScope(),
      'bm-cli-tools:login': () => this.login(),
      'bm-cli-tools:logout': () => this.logout(),
      'bm-cli-tools:pull': () => this.pull(),
      'bm-cli-tools:deploy': () => this.deploy(),
      'bm-cli-tools:createInteraction': () => this.createInteraction(),
    }));
  },

  deactivate() {
    this.form.destroy();
    this.modalPanel.destroy();
    this.subscriptions.dispose();
  },

  serialize() {
    return {};
  },

  destroyView() {
    this.form.destroy();
    this.form = null;
    this.modalPanel.hide();
    this.modalPanel.destroy();
    this.modalPanel = null;
  },

  runCommand(command, params, ...args ) {
    let error;
    let output;

    let stdin;
    let callback;
    if (args.length === 2) {
      [stdin, callback] = args;
    } else {
      [callback] = args;
    }

    const cmd = spawn(command, params, {
      cwd: atom.project.rootDirectories[0].path
    });

    if (stdin) {
      cmd.stdin.write(stdin);
      cmd.stdin.end();
    }

    cmd.stdout.on('data', data => {
      output = new TextDecoder('utf-8').decode(data);
      console.log(`stdout: ${data}`);
    });

    cmd.stderr.on('data', data => {
      error = data;
      console.log(`stderr: ${data}`);
    });

    cmd.on('close', code => {
      if (code === 0) {
        callback(null, output)
      } else {
        callback(error);
      }
      console.log(`child process exited with code ${code}`);
    });
  },

  setScope() {
    this.form = new Form(this.state, {
      title: 'Which answerSpace to use?',
      close: () => this.destroyView(),
      fields: [{
        name: 'answerspace',
        type: 'text',
        label: 'Answerspace',
        action: () => this.handleScopeSet()
      }],
      buttons: [{
        name: 'save',
        label: 'Save',
        action: () => this.handleScopeSet()
      }, {
        name: 'cancel',
        label: 'Cancel',
        action: () => this.destroyView()
      }]
    });

    this.modalPanel = atom.workspace.addModalPanel({
      item: this.form.getElement(),
      visible: false
    });

    this.modalPanel.show();
  },

  handleScopeSet() {
    const input = document.querySelector('#answerspace');
    const scope = input.value;
    this.form.destroy();
    this.form = null;
    this.modalPanel.hide();

    this.runCommand('bm', ['bmp', 'scope', scope], (err) => {
      if (err) {
        atom.notifications.addError(`Error setting scope: ${err}`);
      } else {
        atom.notifications.addSuccess(`Scope set to: ${scope}`);
      }
    });
  },

  login() {
    this.form = new Form(this.state, {
      title: 'Enter your authentication token',
      close: () => this.destroyView(),
      fields: [{
        name: 'token',
        type: 'password',
        label: 'Token',
        action: () => this.handleLogin()
      }],
      buttons: [{
        name: 'save',
        label: 'Save',
        action: () => this.handleLogin()
      }, {
        name: 'cancel',
        label: 'Cancel',
        action: () => this.destroyView()
      }]
    });

    this.modalPanel = atom.workspace.addModalPanel({
      item: this.form.getElement(),
      visible: false
    });

    this.modalPanel.show();
  },

  handleLogin() {
    const input = document.querySelector('#token');
    const token = input.value;
    this.form.destroy();
    this.form = null;
    this.modalPanel.hide();

    this.runCommand('bm', ['bmp', 'login'], token, (err, output) => {
      if (err) {
        atom.notifications.addError(`Error logging in to Blink: ${err}`);
      } else {
        atom.notifications.addSuccess(output);
      }
    });
  },

  logout() {
    this.runCommand('bm', ['bmp', 'logout'], (err) => {
      if (err) {
        atom.notifications.addError(`Error logging out of Blink: ${err}`);
      } else {
        atom.notifications.addSuccess(`Logged out of Blink`);
      }
    });
  },

  deploy() {
    this.runCommand('bm', ['bmp', 'deploy'], (err) => {
      if (err) {
        atom.notifications.addError(`Error deploying to Blink: ${err}`);
      } else {
        atom.notifications.addSuccess(`Deploy successful`);
      }
    });
  },

  pull() {
    this.runCommand('bm', ['bmp', 'pull'], (err) => {
      if (err) {
        atom.notifications.addError(`Error pulling code from Blink: ${err}`);
      } else {
        atom.notifications.addSuccess(`Pull successful`);
      }
    });
  },

  createInteraction() {
    this.form = new Form(this.state, {
      title: 'Enter name for interaction',
      close: () => this.destroyView(),
      fields: [{
        name: 'interactionName',
        type: 'text',
        label: 'Interaction name',
        action: () => this.handleCreate()
      }, {
        name: 'interactionType',
        label: 'Interaction type',
        type: 'select',
        options: ['madl', 'message']
      }],
      buttons: [{
        name: 'save',
        label: 'Create',
        action: () => this.handleCreate()
      }, {
        name: 'cancel',
        label: 'Cancel',
        action: () => this.destroyView()
      }]
    });
    this.modalPanel = atom.workspace.addModalPanel({
      item: this.form.getElement(),
      visible: false
    });
    this.modalPanel.show();
  },

  handleCreate() {
    const input = document.querySelector('#interactionName');
    const interactionName = input.value;
    const select = document.querySelector('#interactionType');
    const type = select.value;
    this.form.destroy();
    this.form = null;
    this.modalPanel.hide();

    this.runCommand('bm', ['bmp', 'login', `--type=${type}`], interactionName, (err, output) => {
      if (err) {
        atom.notifications.addError(`Error creating interaction: ${err}`);
      } else {
        atom.notifications.addSuccess(`Interaction created: ${interactionName}`);
      }
    });
  }
};
