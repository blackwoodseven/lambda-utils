window.LambdaFactory = (function($, AWS) {
  return function(conf) {
    var lambda = new AWS.Lambda({
        region : conf.AWS_REGION,
        accessKeyId : conf.AWS_ID,
        secretAccessKey: conf.AWS_SECRET
    });

    return function(name, data) {
        var deferred = $.Deferred();

        data = data || {};

        data = {
	        Payload : JSON.stringify(data),
          FunctionName: name
        };

        lambda.invoke(data, function(err,data) {
            if (err) {
                console.error("[LAMBA] Execution failed", err);
                deferred.reject({
                  name: name,
                  error: err
                });
            } else if (data.StatusCode == 200){
                try {
                    data = JSON.parse(data.Payload);
                } catch (e) {
                    console.error("[LAMDBA] Failed to parse success result from lambda function", e);
                    deferred.reject({
                      name: name,
                      error: e
                    });
                    return;
                }

                if (data.errorMessage) {
                    try {
                      data.errorMessage = JSON.parse(data.errorMessage);
                    } catch(e) {}
                    deferred.reject(data.errorMessage);
                } else {
                  deferred.resolve(data);
                }

            } else {
                console.error("[LAMBDA] Execution returned a error StatusCode", data);
                deferred.reject({
                  name: name,
                  error : data
                });
            }
        });

        return deferred.promise();
    }
  };
})(jQuery, AWS);
