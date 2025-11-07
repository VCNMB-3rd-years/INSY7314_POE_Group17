const httpsRedirect = (req, res, next) => {
  // Only redirect in production and if not already https
  if (process.env.NODE_ENV === 'production' && req.header('x-forwarded-proto') !== 'https') {
    return res.redirect(301, `https://${req.header('host')}${req.url}`);
  }
  next();
};

module.exports = httpsRedirect;

// References:
//GeeksforGeeks. (2025). How to Redirect HTTP to HTTPS in Node.js Express App. [online] Available at: https://www.geeksforgeeks.org/node-js/redirect-http-to-https-in-express/ [Accessed 3 Oct. 2025]
//DigitalOcean. (2022). How To Redirect HTTP to HTTPS in Express.js. [online] Available at: https://www.digitalocean.com/community/tutorials/redirect-http-to-https-express [Accessed 3 Oct. 2025]