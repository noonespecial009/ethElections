var Election = artifacts.require("./Election.sol");

contract("Election", function(accounts) {
  var electionInstance;

  /* Our contract Election.sol is initally initialized with 3 candidates so this
  test ensures that this is indeed the case by calling the function
  candidatesCount and asserting that it returns 3. */
  it("initializes with three candidates", function() {
    return Election.deployed().then(function(instance) {
      return instance.candidatesCount();
    }).then(function(count) {
      assert.equal(count, 3);
    });
  });

  /* This test checks that our 3 candidates are all initialized with the correct 
  values. The Struct Candidate in Election.sol contains 3 fields for: id, name, 
  and the vote count. Each of these three things is tested for each of these
  three things are tested for each of the three candidatesin this test.  */
  it("it initializes the candidates with the correct values", function() {
    return Election.deployed().then(function(instance) {
      electionInstance = instance;
      return electionInstance.candidates(1);
    }).then(function(candidate) {
      assert.equal(candidate[0], 1, "contains the correct id");
      assert.equal(candidate[1], "Arsenio Hall", "contains the correct name");
      assert.equal(candidate[2], 0, "contains the correct votes count");
      return electionInstance.candidates(2);
    }).then(function(candidate) {
      assert.equal(candidate[0], 2, "contains the correct id");
      assert.equal(candidate[1], "Johnny Carson", "contains the correct name");
      assert.equal(candidate[2], 0, "contains the correct votes count");
      return electionInstance.candidates(3);
    }).then(function(candidate) {
      assert.equal(candidate[0], 3, "contains the correct id");
      assert.equal(candidate[1], "Geraldo", "contains the correct name");
      assert.equal(candidate[2], 0, "contains the correct votes count");
    });
  });

  /* This test simply adds a new candidate with the addCandidate function and then
  checks to make sure that the new candidate has an id of 4, the name, "Bobby
  Brown", and 0 votes. */
  it("allows a voter to add a candidate", function() {
    return Election.deployed().then(function(instance) {
      electionInstance = instance;
      candidate = "Bobby Brown";
      electionInstance.addCandidate(candidate, { from: accounts[0] })
      return electionInstance.candidates(4);
    }).then(function(candidate) {
      assert.equal(candidate[0], 4, "contains the correct id");
      assert.equal(candidate[1], "Bobby Brown", "contains the correct name");
      assert.equal(candidate[2], 0, "contains the correct votes count");
    });
  });

  /* This test calls the vote function and then checks to make sure that 
  the logs contain the 'votedEvent' event and the correct candidate id. It then
  calls the voter mapping to make sure the that the Voter's boolean flag is
  set to true, which should make sure they can not vote again. Finally 
  it makes sure the candidate is assigned 5 votes with a first choice vote. */
  it("allows a voter to cast first place vote (5 votes)", function() {
    return Election.deployed().then(function(instance) {
      electionInstance = instance;
      candidateId = 1;
      return electionInstance.vote(candidateId, { from: accounts[0] })
    }).then(function(receipt) {
      assert.equal(receipt.logs.length, 1, "an event was triggered");
      assert.equal(receipt.logs[0].event, "votedEvent", "the event type is correct");
      assert.equal(receipt.logs[0].args._candidateId.toNumber(), candidateId, "the candidate id is correct");
      return electionInstance.voters(accounts[0]);
    }).then(function(voted) {
      assert(voted, "the voter was marked as voted");
      return electionInstance.candidates(candidateId);
    }).then(function(candidate) {
      var voteCount = candidate[2];
      assert.equal(voteCount, 5, "increments the candidate's vote count");
    });
  });

  /* This test is identical to the previous except it is checking the 
  candidate with id 2 instead of id 1 and it checking whether a 
  second place has been registered which is worth 3 votes. */
  it("allows a voter to cast second place vote (3 votes)", function() {
    return Election.deployed().then(function(instance) {
      electionInstance = instance;
      candidateId = 2;
      return electionInstance.vote2(candidateId, { from: accounts[0] })
    }).then(function(receipt) {
      assert.equal(receipt.logs.length, 1, "an event was triggered");
      assert.equal(receipt.logs[0].event, "votedEvent", "the event type is correct");
      assert.equal(receipt.logs[0].args._candidateId.toNumber(), candidateId, "the candidate id is correct");
      return electionInstance.voters(accounts[0]);
    }).then(function(voted) {
      assert(voted, "the voter was marked as voted");
      return electionInstance.candidates(candidateId);
    }).then(function(candidate) {
      var voteCount = candidate[2];
      assert.equal(voteCount, 3, "increments the candidate's vote count");
    });
  });
  /* This test adds 99 votes to a candidate and then checks to make sure
  the error message contains 'revert'. It then tests to make
  sure that each of the candidates have the correct # of votes: 5, 3, and 0 */
  it("throws an exception for invalid candidates", function() {
    return Election.deployed().then(function(instance) {
      electionInstance = instance;
      return electionInstance.vote(99, { from: accounts[1] })
    }).then(assert.fail).catch(function(error) {
      assert(error.message.indexOf('revert') >= 0, "error message must contain revert");
      return electionInstance.candidates(1);
    }).then(function(candidate1) {
      var voteCount = candidate1[2];
      assert.equal(voteCount, 5, "candidate 1 did not recieve any votes");
      return electionInstance.candidates(2);
    }).then(function(candidate2) {
      var voteCount = candidate2[2];
      assert.equal(voteCount, 3, "candidate 2 did not receive any votes");
      return electionInstance.candidates(3);
    }).then(function(candidate3) {
      var voteCount = candidate3[2];
      assert.equal(voteCount, 0, "candidate 3 did not receive any votes");
    });
  });

  /* This test delegates a first place choice to candidate 3 worth 5 votes.
  It checks to make sure that the candidate has five votes recorded as
  expected. It thens gives the same candidate another five votes and checks
  to make sure that the error message contains 'revert'. Finally the 
  running tallys of each candidate is checked to make sure that noones 
  vote tallies increased. At the end of the testing, candidates 1 and 3
  should have 5 votes each and candidate 2 should have 3.*/
  it("throws an exception for double voting", function() {
    return Election.deployed().then(function(instance) {
      electionInstance = instance;
      candidateId = 3;
      electionInstance.vote(candidateId, { from: accounts[1] });
      return electionInstance.candidates(candidateId);
    }).then(function(candidate) {
      var voteCount = candidate[2];
      assert.equal(voteCount, 5, "accepts first vote");
      // Try to vote again
      return electionInstance.vote(candidateId, { from: accounts[1] });
    }).then(assert.fail).catch(function(error) {
      assert(error.message.indexOf('revert') >= 0, "error message must contain revert");
      return electionInstance.candidates(3);
    }).then(function(candidate3) {
      var voteCount = candidate3[2];
      assert.equal(voteCount, 5, "candidate 3 did not receive any votes");
      return electionInstance.candidates(2);
    }).then(function(candidate2) {
      var voteCount = candidate2[2];
      assert.equal(voteCount, 3, "candidate 2 did not receive any votes");
      return electionInstance.candidates(1);
    }).then(function(candidate1) {
      var voteCount = candidate1[2];
      assert.equal(voteCount, 5, "candidate 1 did not receive any votes");
    });
  });
});
