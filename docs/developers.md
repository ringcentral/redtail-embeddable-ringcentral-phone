no_breadcrumb:true

# Customizing RingCentral for Redtail CRM

Developers are free to customize their RingCentral integration with Redtail CRM by forking the project on github:

```bash
git clone https://github.com/ringcentral/redtail-embeddable-ringcentral-phone.git
cd redtail-embeddable-ringcentral-phone
npm i
```

## Create Your App

On RingCentral you will need to create an application with your developer console. To create the app quickly, click the button below:

<a class="btn btn-primary" href="https://developer.ringcentral.com/new-app?name=Embeddable+Redtail+CRM+App&desc=An+app+that+adds+a+RingCentral+phone+to+your+Redtail+CRM+account.&public=false&type=BrowserBased&carriers=7710,7310,3420&permissions=Contacts,ReadAccounts,ReadCallLog,ReadContacts,ReadMessages,RingOut,VoipCalling&redirectUri=https://ringcentral.github.io/ringcentral-embeddable/redirect.html">Create RingCentral App</a>

## Edit config.js

You will need to create your config file using the template provided:

```bash
cp config.sample.js config.js
```

Look for the following section, and enter in your RingCentral Client ID, and set the server to the proper environment:

```json
//// ringcentral config
ringCentralConfigs: {
  // your ringCentral app's Client ID
  // clientID: 'qypCMxxxxxxxivhrrGVeCrw',

  // your ringCentral app's Auth Server URL
  // appServer: 'https://platform.devtest.ringcentral.com'
},
```

## Start Up

You are ready to start up your app.

```bash
npm start
```

## Customize Your Integration

To customize your integration, edit the many `.js` files in the `src` directory. As you edit, webpack will rebuild automatically.

## Install Your Extension

1. Open your [Chrome extension page](chrome://extensions/).
    
    <img src="../img/chrome.png" class="img-fluid">

2. Turn on "Developer mode" in the upper right hand corner if it is turned off.

3. Click "Load unpacked."

4. Select the `redtail-embeddable-ringcentral-phone/dist` folder, and click "Select."
