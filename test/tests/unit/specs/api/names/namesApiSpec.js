describe("Names API", function () {

    var namesApi;

    beforeEach(function () {
        var fakeRouter = new FakeRouter();
        namesApi = new ozpIwc.api.names.Api({
            authorization: ozpIwc.wiring.authorization,
            'name': "names.test.api",
            'participant': new TestClientParticipant({
                authorization: ozpIwc.wiring.authorization,
                router: fakeRouter
            }),
            'router': fakeRouter
        });
        namesApi.isRequestQueueing = false;
        namesApi.leaderState = "leader";
    });

    afterEach(function () {
        namesApi = null;
    });

    it("responds with badResource for arbitrary resources", function () {
        var context = new TestPacketContext({
            'leaderState': "leader",
            'packet': {
                'resource': "/doesNotExist",
                'action': "get",
                'msgId': "1234",
                'src': "srcParticipant"
            }
        });
        namesApi.receivePacketContext(context);
        expect(context.responses[0].response).toEqual("badResource");
    });


    [{
        'resource': "/address",
        'contentType': "application/json",
        'entity': []
    }, {
        'resource': "/multicast",
        'contentType': "application/json",
        'entity': []
    }, {
        'resource': "/router",
        'contentType': "application/json",
        'entity': []
    }, {
        'resource': "/api",
        'contentType': "application/json",
        'entity': [
            "/api/data.api",
            "/api/intents.api",
            "/api/names.api",
            "/api/system.api",
            "/api/locks.api"
        ]
    }
    ].forEach(function (r) {
            describe("Resource tree root " + r.resource, function () {
                var contextFor = function (action) {
                    return new TestPacketContext({
                        'leaderState': "leader",
                        'packet': {
                            'resource': r.resource,
                            'action': action,
                            'msgId': "1234",
                            'src': "srcParticipant"
                        }
                    });
                };

                it("replies to get", function () {
                    var context = contextFor("get");
                    namesApi.receivePacketContext(context);
                    expect(context.responses[0].response).toEqual("ok");
                    expect(context.responses[0].entity).toEqual(r.entity);
                    expect(context.responses[0].contentType).toEqual(r.contentType);
                });

                it("replies to list", function () {
                    var context = contextFor("list");
                    namesApi.receivePacketContext(context);
                    expect(context.responses[0].response).toEqual("ok");
                    expect(context.responses[0].entity).toEqual(r.entity);
                    expect(context.responses[0].contentType).toEqual(r.contentType);
                });

                it("replies to bulkGet", function () {
                    var context = contextFor("bulkGet");
                    namesApi.receivePacketContext(context);
                    expect(context.responses[0].response).toEqual("ok");
                    expect(
                        context.responses[0].entity.map(function (e) {
                            return e.resource;
                        })
                    ).toEqual(r.entity);
                    expect(context.responses[0].contentType).toEqual(r.contentType);
                });

                it("responds with noPermission when attempting to set", function () {
                    var context = new TestPacketContext({
                        'leaderState': "leader",
                        'packet': {
                            'resource': r.resource,
                            'action': "set",
                            'msgId': "1234",
                            'src': "srcParticipant",
                            'entity': {'foo': 1}
                        }
                    });
                    namesApi.receivePacketContext(context);
                    expect(context.responses[0].response).toEqual("noPermission");
                });
            });
        });

    [{
        'resource': "/address",
        'contentType': "application/vnd.ozp-iwc-address-v1+json",
        'listContentType': "application/json"
    }, {
        'resource': "/multicast",
        'contentType': "application/vnd.ozp-iwc-multicast-address-v1+json",
        'listContentType': "application/json"
    }, {
        'resource': "/api",
        'contentType': "application/vnd.ozp-iwc-api-v1+json",
        'listContentType': "application/json"
    }, {
        'resource': "/router",
        'contentType': "application/vnd.ozp-iwc-router-v1+json",
        'listContentType': "application/json"
    }
    ].forEach(function (r) {
            describe("Resource tree " + r.resource, function () {

                it("allows  " + r.contentType + " when setting a value in the tree", function () {
                    var context = new TestPacketContext({
                        'leaderState': "leader",
                        'packet': {
                            'resource': r.resource + "/testValue",
                            'contentType': r.contentType,
                            'action': "set",
                            'msgId': "1234",
                            'src': "srcParticipant",
                            'entity': {'foo': 1}
                        }
                    });
                    namesApi.receivePacketContext(context);
                    expect(context.responses[0].response).toEqual("ok");

                });

                it("updates the collection when setting a value in the tree", function () {
                    var resourceName = r.resource + "/testValue";
                    namesApi.data[resourceName] = new ozpIwc.api.base.Node({
                        'resource': resourceName,
                        'contentType': r.contentType,
                        'entity': {'foo': 1}
                    });
                    var context = new TestPacketContext({
                        'leaderState': "leader",
                        'packet': {
                            'resource': r.resource,
                            'action': "get",
                            'msgId': "1234",
                            'src': "srcParticipant"
                        }
                    });
                    namesApi.receivePacketContext(context);
                    expect(context.responses[0].response).toEqual("ok");
                    expect(context.responses[0].entity).toContain(r.resource + "/testValue");
                    expect(context.responses[0].contentType).toEqual(r.listContentType);
                });

                it("responds with badContent when missing the contentType", function () {
                    var context = new TestPacketContext({
                        'leaderState': "leader",
                        'packet': {
                            'resource': r.resource + "/testValue",
                            'action': "set",
                            'msgId': "1234",
                            'src': "srcParticipant",
                            'entity': {'foo': 1}
                        }
                    });
                    namesApi.receivePacketContext(context);
                    expect(context.responses[0].response).toEqual("badContent");

                });

                it("responds with badContent with invalid contentType", function () {
                    var context = new TestPacketContext({
                        'leaderState': "leader",
                        'packet': {
                            'resource': r.resource + "/testValue",
                            'action': "set",
                            'contentType': r.contentType + "+xml",
                            'msgId': "1234",
                            'src': "srcParticipant",
                            'entity': {'foo': 1}
                        }
                    });
                    namesApi.receivePacketContext(context);
                    expect(context.responses[0].response).toEqual("badContent");
                });

            });
        });
});