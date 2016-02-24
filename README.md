# Lambda utils

This project contains various HTML utils to test and mesure performance of AWS Lambda functions. Currently there's only the [Latency](#Latency) util, but we expect to increase this set of tools during the development of the different projects using AWS Lambda as main backend implementation.

> All this projects are independent and they are written without good coding practices on mind. So you can check out the code for examples, but do not use them as reference. They contain a lot of quick and dirty solutions just to get the job done.

## Installation and configuration
All the required installation is a web server that offers the `src` folder as root for some website. Each component configuration should be configured independently, without a shared pattern on it.

## Tools and utils

### Latency
The latency page can be used to measure the different execution times of multiple lambda functions. Current limitation is that all the lambda functions should be deployed on the same AWS Region and the provided credentials should be valid for all of them.

This project will store the credentials and the executions parameters (not the list of lambdas) on the local storage of the browser, so ensure you browser is in a safe place before using some credentials with too much permissions associated in public machines.

#### Configuration

The first page of the latency tool is the configuration page, where you will define the lambda functions to be executed together with the sample JSON object used as event data. You can use the notation `name:version` to test a specific version/alias of the function.

Once a lambda function is defined, the run panel will appear. There you'll be able to setup the AWS keys to use, the AWS region where lambda functions are deployed, the count of iterations and delay between them. All this values will be stored on the browser localStorage, so you don't have to reset them all the time.
