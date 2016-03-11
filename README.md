# Lambda utils

This project contains various HTML utils to test and mesure performance of AWS Lambda functions. Currently there's only the [Latency](#latency) util, but we expect to increase this set of tools during the development of the different projects using AWS Lambda as main backend implementation.

This project is deployed using gh-pages for convenience, so you can open it at [http://blackwoodseven.github.io/lambda-utils](http://blackwoodseven.github.io/lambda-utils)

> All this projects are independent and they are written without good coding practices on mind. So you can check out the code for examples, but do not use them as reference. They contain a lot of quick and dirty solutions just to get the job done.

## Installation and configuration
All the required installation is a web server that offers the `src` folder as root for some website. Each component configuration should be configured independently, without a shared pattern on it.

## Tools and utils

### Latency
The latency page can be used to measure the different execution times of multiple lambda functions. Current limitation is that all the lambda functions should be deployed on the same AWS Region and the provided credentials should be valid for all of them.

This project will store the credentials and the executions parameters (not the list of lambdas) on the local storage of the browser, so ensure you browser is in a safe place before using some credentials with too much permissions associated in public machines.
