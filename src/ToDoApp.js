
var ToDoApp = window.ToDoApp = (function() {

  
  // Private members
  var _templates = {

    body:
      '<h1>Kontrakter:</h1>\
      <div id="left-col">\
        <div id="lists"></div>\
          \
      </div>\
      <div id="right-col">\
        <div id="tasks"></div>\
        <div>\
          \
        </div>\
      </div>',
    list: '<a href="<%= href %>">Kontrakt #: <%= id %> <br></br> Genstand: <%= name %> <br><br/> Kunde: <%= customer %> <br><br/> Dato for udbetaling: <%= payDate %> <br/> Rente pr. måned: <%= interest %> <br/> Udbetaling: <%= payout %> </a>  <br><br/> <input type="button" onclick="" value="send besked"/> <br><br/>',
    
  };
  
  function _bindPressEnter(callback) {
    return (function(evt) {
      if (evt.which === 13) {
        callback(evt);
      };
    });
  };

  var _bindButtons = function() {

    // Bind input for creating new lists
    this.containerElement.find('#create-list-name-input')
    .on('keyup', _bindPressEnter(function(evt) {

      this.createList({ title: $('#create-list-name-input').val() })
      .then(this.loadLists.bind(this))
      .then(this.drawLists.bind(this))
      .catch(console.error.bind(console));

      $('#create-list-name-input').val('');

    }.bind(this)));
    
    // Bind input for creating new tasks
    this.containerElement.find('#create-task-name-input')
    .on('keyup', _bindPressEnter(function(evt) {

      this.createTask({ title: $('#create-task-name-input').val() })
      .then(this.loadLists.bind(this))
      .then(this.loadTasks.bind(this))
      .then(this.drawTasks.bind(this))
      .catch(console.error.bind(console));
      
      $('#create-task-name-input').val('');

    }.bind(this)));
  };

  var _getCurrentList = function() {
    return window.location.hash.substring(1);
  };

  // Constructor

  function ToDoApp(config) {

    this.containerElement = $(config.container);
    this.containerElement.html(_templates.body).show();

    this.listsTemplateId = config.listsTemplateId;

    this.podio = config.podio;

    this.lists = [];
    this.tasks = [];

    _bindButtons.call(this);

    window.onhashchange = function() {

      this.drawLists()
      .then(this.drawTasks.bind(this, _getCurrentList()))
      .catch(console.error.bind(console));
    }.bind(this);

  };

  // Public members

  ToDoApp.prototype.setUpWorkspace = function() {

    var self = this;
    
    // Retrieve a list of existing apps in this project
    return self.podio.request('get', '/item/app/25242224/?limit=500&remember=true&sort_desc=true').then(function(apps) {

      // If the project contains any apps,
      // we simply use the first one we find
      if (apps.items.length > 0) {
        return Promise.resolve(apps.items);
      }
    })
  };

  ToDoApp.prototype.loadLists = function() {
    
    var self = this;

    return new Promise(function(resolve, reject) {
      self.podio.request('get', '/item/app/' + self.listsTemplateId + '/?limit=500&remember=true&sort_desc=true')
      .then(function(response) {
        self.lists = response.items;
        return resolve();
      })
      .catch(reject);
    });
  };

  ToDoApp.prototype.drawLists = function() {
    var self = this;
    var listTemplate = _.template(_templates.list);

    return Promise.resolve().then(function() {

      // Get a reference to the lists section of the left column
      // since list items should be rendered in this
      var listsElement = self.containerElement.find("#lists");

      // Clear existing HTML
      listsElement.empty();

      self.lists.forEach(function(listItem) {

        // Get a reference to the list item's title field
        var titleField = _.find(listItem.fields, { external_id: 'titel'});
        var dateField = _.find(listItem.fields, { external_id: 'dato-for-udbetaling'})
        var customerField = _.find(listItem.fields, { external_id: 'relation'})
        var payoutField = _.find(listItem.fields, { external_id: 'udbetaling'})
        var interestField = _.find(listItem.fields, { external_id: 'rente-pr-maned'})
        // Iterate through each list that have valid field data values
        if(listItem.fields.length && titleField.values.length) {
          try {
            var itemCustomer = customerField.values[0].value.title;
          } catch(err) {
            var itemCustomer = "Mangler kundenavn";
            console.log("intet kundenavn");
          }
          // Retrieve title and item_id
          var itemName = titleField.values[0].value;
          var itemId = listItem.item_id;
          var itemCustomerImg = listItem.initial_revision.user.image.thumbnail_link;
          var itemPayDate = dateField.values[0].start_utc;
          var itemPayout = payoutField.values[0].currency + " " + payoutField.values[0].value;
          var itemInterest = interestField.values[0].value;

          // Create a DOM element for this list, using the list template
          // and append it to the left column list container element
          var itemElement = $('<div></div>').html(listTemplate({
            href: '#' + itemId,
            name: itemName,
            customer: itemCustomer,
            id: itemId,
            imgSrc: itemCustomerImg,
            payDate: itemPayDate,
            payout: itemPayout,
            interest: itemInterest,
          }))
          .addClass('list')
          .toggleClass('active', itemId == _getCurrentList())
          .appendTo(listsElement);
        }
      });
    });
  };

  return ToDoApp;
})();