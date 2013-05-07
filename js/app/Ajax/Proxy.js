Ext.define('Optima5.Ajax.Proxy',{
	extend: 'Ext.data.Connection',
	requires: ['Optima5.Ajax.Connection'],
	
	optUrl: '',
	optParams: {},
	optConnection: null,
	
	constructor: function(cfg) {
		var me = this ;
		Ext.apply(cfg,{
			//url: me.optUrl,
			actionMethods: {
				create:'POST',
				read:'POST',
				update:'POST',
				destroy:'POST'
			}
		});
		//Ext.apply(cfg.extraParams,me.optParams);
		
		me.optConnection = Ext.create('Optima5.Ajax.Connection',{
			optUrl: cfg.optUrl,
			optParams: cfg.optParams
		});
		
		me.callParent() ;
	},
	doRequest: function(operation, callback, scope) {
		var writer  = this.getWriter(),
				request = this.buildRequest(operation, callback, scope);

		if (operation.allowWrite()) {
				request = writer.write(request);
		}

		Ext.apply(request, {
				headers       : this.headers,
				timeout       : this.timeout,
				scope         : this,
				callback      : this.createRequestCallback(request, operation, callback, scope),
				method        : this.getMethod(request),
				disableCaching: false // explicitly set it to false, ServerProxy handles caching
		});
		
		me.optConnection.request(request);
		
		return request;
	}
});