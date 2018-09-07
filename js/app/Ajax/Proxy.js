Ext.define('Optima5.Ajax.Proxy',{
	extend: 'Ext.data.proxy.Ajax',
	requires: ['Optima5.Ajax.Connection'],
	
	timeout: 120000,
	
	optUrl: '',
	optParams: {},
	optConnection: null,
	
	constructor: function(cfg) {
		var me = this ;
		Ext.apply(cfg,{
			url: 'dummy',
			actionMethods: {
				create:'POST',
				read:'POST',
				update:'POST',
				destroy:'POST'
			}
		});
		Ext.applyIf(cfg,{
			reader:{
				type:'json'
			}
		});
		//Ext.apply(cfg.extraParams,me.optParams);
		
		me.optConnection = Ext.create('Optima5.Ajax.Connection',{
			optUrl: cfg.optUrl,
			optParams: cfg.optParams
		});
		
		me.callParent([cfg]) ;
	},
	sendRequest: function(request) {
		request.setRawRequest(this.optConnection.request(request.getCurrentConfig()));
		this.lastRequest = request;

		return request;
	}
});
