Ext.define('Optima5.Ajax.Connection',{
	extend: 'Ext.data.Connection',
	autoAbort : false,
	timeout: 60000,
	
	optUrl: '',
	optParams: {},
			  
	request : function( options ) {
		var me = this ;
		
		if( me.optUrl != '' ) {
			options.url = me.optUrl ;
		}
		
		/*
		 * me.optParams = {
		 * 	_sessionId:
		 * 	_moduleId:
		 * 	_sdomainId:
		 * }
		 */
		Ext.apply(options.params,me.optParams) ;
		
		Ext.apply(options,{
			cacheSuccess: options.success,
			cacheFailure: options.failure,
			cacheCallback: options.callback,
		}) ;
		
		Ext.apply(options,{
			callback: function(options,success,result) {
				if( success==true ) {
					var jsonData ;
					try{
						jsonData = Ext.decode(result.responseText);
					}
					catch(e){
						Ext.MessageBox.alert('Error!', 'Data returned is not valid!'+"\n"+result.responseText);
					}
					
					if( jsonData.sessionLost == true )
						return Optima5.Helper.getApplication().onSessionInvalid() ;
					
					Ext.callback(options.cacheSuccess, options.scope, [result, options]);
				}
				else
				{
					Ext.MessageBox.alert('Error!', 'The web transaction failed!');
					
					Ext.callback(options.cacheSuccess, options.scope, [result, options]);
				}
				Ext.callback(options.cacheCallback, options.scope, [result, success, options]);
			},
			success : Ext.emptyFn,
			failure : Ext.emptyFn
		}) ;
		
		this.callParent(arguments) ;
	}
});
