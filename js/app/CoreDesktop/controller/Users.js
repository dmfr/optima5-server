Ext.define('Optima5.CoreDesktop.controller.Users', {
    extend: 'Ext.app.Controller',

    
	init: function() {
        this.control({
            'viewport > panel': {
                render: this.onPanelRendered
            },
				'userlist': {
					itemdblclick: this.editUser
				}
        });
    } ,
			  
	views: [
        'Optima5.CoreDesktop.view.Userlist'
    ],


    onPanelRendered: function() {
        console.log('The panel was rendered');
    },
    editUser: function(a,b,c) {
        console.log(b);
    }
    
});