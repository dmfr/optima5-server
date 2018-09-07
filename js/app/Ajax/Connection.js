Ext.define('Optima5.Ajax.Connection',{
	extend: 'Ext.data.Connection',
	autoAbort : false,
	timeout: 120000,
	
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
		Ext.applyIf(options.params,me.optParams) ;
		
		Ext.apply(options,{
			cacheSuccess: options.success,
			cacheFailure: options.failure,
			cacheCallback: options.callback
		}) ;
		
		Ext.apply(options,{
			callback: function(options,success,result) {
				if( result.request.aborted ) {
					return ;
				}
				if( success==true ) {
					var jsonData, jSuccess=false ;
					try{
						var responseText = ( result.responseText != null ? result.responseText : '' ) ;
						jsonData = Ext.decode(responseText);
						
						if( jsonData.sessionLost == true ) {
							return Optima5.Helper.getApplication().onSessionInvalid() ;
						}
						
						if( jsonData.authDenied == true ) {
							Ext.MessageBox.alert('Error!', 'Permission denied !');
						} else {
							jSuccess=true ;
						}
					}
					catch(e){
						Ext.MessageBox.alert('Error!', 'Data returned is not valid!'+"\n"+result.responseText);
					}
					
					if( jSuccess ) {
						Ext.callback(options.cacheSuccess, options.scope, [result, options]);
					} else {
						Ext.callback(options.cacheFailure, options.scope, [result, options]);
					}
				}
				else
				{
					Ext.MessageBox.alert('Error!', 'The web transaction failed!');
					
					Ext.callback(options.cacheFailure, options.scope, [result, options]);
				}
				Ext.callback(options.cacheCallback, options.scope, [options, success, result]);
			},
			success : Ext.emptyFn,
			failure : Ext.emptyFn
		}) ;
		
		this.callParent([options]) ;
	}
});
