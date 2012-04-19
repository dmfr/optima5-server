Ext.define('Optima5.CoreDesktop.Ajax',{
	extend: 'Ext.data.Connection',
	singleton: true,
	autoAbort : false,
			  
	request : function () {

		arguments[0].params = Ext.apply(arguments[0].params,{
			_sessionName: op5session.get('session_id')
		}) ;
		
		arguments[0] = Ext.apply(arguments[0], {
			
			callback : function(options,success,result) {
				//console.dir(options) ;
				
				if( success==true ) {
					var jsonData ;
					try{
						jsonData = Ext.decode(result.responseText);
					}
					catch(e){
						Ext.MessageBox.alert('Error!', 'Data returned is not valid!'+"\n"+result.responseText);
					}
					if( Ext.decode(result.responseText).sessionLost == true )
						return op5desktop.onSessionInvalid() ;
					options.succCallback.call(options.scope, result, options);
					
				}
				else
				{
					Ext.MessageBox.alert('Error!', 'The web transaction failed!');
				}
			},
			
			success : Ext.emptyFn,
			failure : Ext.emptyFn
			
		});
		
		this.callParent(arguments) ;
	}
});


/*
TKE.data.Connection = function(config) {
    // call parent constructor
    TKE.data.Connection.superclass.constructor.call(this, config);
}; 


Ext.extend(TKE.data.Connection, Ext.data.Connection, {
		
		request : function(config){
			
			config = Ext.apply(config, {
				
		 		callback: function(options, success, result) {
		            Ext.getBody().unmask();
		            if (success === true) {
		                var jsonData;
		                try {
		                    jsonData = Ext.decode(result.responseText);
		                }
		                catch (e) {
		                    Ext.MessageBox.alert('Error!', 'Data returned is not valid!');
		                }
		                options.succCallback.call(options.scope, jsonData, options);
		
		            }
		            else {
		                Ext.MessageBox.alert('Error!', 'The web transaction failed!');
		            }
		        } 
		 	
		 	}
		 );
		 
	 	TKE.data.Connection.superclass.request.call(this, config);
	}
});
*/