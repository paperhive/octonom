# octonom
[![Build Status](https://travis-ci.org/paperhive/octonom.svg?branch=master)](https://travis-ci.org/paperhive/octonom)
[![codecov](https://codecov.io/gh/paperhive/octonom/branch/master/graph/badge.svg)](https://codecov.io/gh/paperhive/octonom)

Octonom brings you TypeScript-based models and collections for any database with actual separation of concerns:

* *Models* organize your data with a schema and can validate instances. Models are independent of how the data is actually stored in databases.
* *Collections* map your database data to model instances and vice versa. There are collection types for several databases. For example, you can decide to store one model in CouchDB and another in MongoDB – in the same application and they can even reference each other.

Features of octonom:

* clear separation of concerns
* models allow you to work with your data
* collections take care of persisting and retrieving data to/from a database
* models are actual TypeScript/ES6 classes
* type safety: your model properties have types
* extensible: if you need something specific, just extend the octonom classes
* multi-database support: implementing a collection for your favorite database is just a few lines
* runs in NodeJS and browsers
