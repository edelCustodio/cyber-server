

var serverCookiesHandler = {
    setCookie: function(mainSession, username) {
      
      mainSession.cookies.set({
        url: 'http://localhost:6969',
        name: username,
        value: username,
        domain: 'skynet.friasoftit.com'
      }, (error) => {
        console.log(error);
      })
    }
  }
  
  module.exports = serverCookiesHandler
  