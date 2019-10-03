Ext.define('DbsLamGunPrinterModel',{
	extend: 'Ext.data.Model',
	idProperty: 'printer_uri',
	fields: [
		{name: 'printer_uri', type:'string'},
		{name: 'printer_type', type:'string'},
		{name: 'printer_spool_ip', type:'string'},
		{name: 'printer_qz_name', type:'string'},
		{name: 'printer_desc', type:'string'}
	]
});


Ext.define('Optima5.Modules.Spec.DbsLam.GunHelper',{
	mixins: {
		observable: 'Ext.util.Observable'
	},
	
	singleton:true,
	
	// business logic data
	cfgGunPrinterStore: null,
	
	isReady: false,
	
	constructor: function(config) {
		//build store
		var me = this ;
		me.mixins.observable.constructor.call(this, config);
	},
	init: function(optimaModule) {
		var me = this ;
		me.optimaModule = optimaModule ;
		me.isReady = false ;
		
		Ext.defer(function() {
			me.libCount = 2 ;
			
			this.cfgGunPrinterStore = Ext.create('Ext.data.Store',{
				model: 'DbsLamGunPrinterModel',
				data : []
			}) ;
			me.queryPrintersSpool() ;
			me.queryPrintersQz() ;
		},500,me) ;
	},
	onLibLoad: function() {
		var me = this ;
		me.libCount-- ;
		if( me.libCount == 0 ) {
			me.isReady=true ;
			me.fireEvent('ready',this) ;
		}
	},
	
	queryPrintersSpool: function() {
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_dbs_lam',
				_action: 'transferPacking_getPrinters'
			},
			success: function(response) {
				var ajaxData = Ext.decode(response.responseText) ;
				if( !ajaxData.success ) {
					return ;
				}
				var rows = [] ;
				Ext.Array.each( ajaxData.data, function(row) {
					if( row.printer_type != 'ZPL' ) {
						return ;
					}
					rows.push({
						printer_uri: 'spool'+':'+row.printer_ip,
						printer_type: 'spool',
						printer_spool_ip: row.printer_ip,
						printer_desc: row.printer_desc
					});
				}) ;
				this.cfgGunPrinterStore.add(rows) ;
			},
			callback: function() {
				this.onLibLoad() ;
			},
			scope: this
		});
	},
	queryPrintersQz: function() {
		var me = this ;
		this.onQzConnected().then(function() {
			qz.printers.find().then(function(data) {
				var rows = [] ;
				Ext.Array.each(data, function(qzName) {
					rows.push({
						printer_uri: 'qz'+':'+qzName,
						printer_type: 'qz',
						printer_qz_name: qzName,
						printer_desc: 'QZ: '+qzName
					});
				}) ;
				me.cfgGunPrinterStore.add(rows) ;
				me.onLibLoad() ;
			}).catch(function(e) { 
				me.onLibLoad() ;
			})
		}).catch(function(e) {
			me.onLibLoad() ;
		})
	},
	
	getGunPrinterAll: function() {
		return Ext.pluck( this.cfgGunPrinterStore.getRange(), 'data' ) ;
	},
	getPrinterType: function(printerUri) {
		return this.cfgGunPrinterStore.getById(printerUri) ? this.cfgGunPrinterStore.getById(printerUri).get('printer_type') : null ;
	},
	getPrinterSpoolIp: function(printerUri) {
		return this.cfgGunPrinterStore.getById(printerUri) ? this.cfgGunPrinterStore.getById(printerUri).get('printer_spool_ip') : null ;
	},
	getPrinterQzName: function(printerUri) {
		return this.cfgGunPrinterStore.getById(printerUri) ? this.cfgGunPrinterStore.getById(printerUri).get('printer_qz_name') : null ;
	},
	
	onQzConnected: function() {
		return new Promise((resolve, reject) => {
			if( typeof qz == 'undefined' ) {
				reject("Qz disabled") ;
			}
			if( qz.websocket.isActive() ) {
				resolve() ;
			}
			qz.websocket.connect().then( function() {
				resolve() ;
			}).catch(function(e) { reject("Qz : cannot connect") ; });
		})
	},
	doQzPrint: function(zplBinary,qzName) {
		this.onQzConnected().then(function() {
			return qz.printers.find(qzName);
		}).then(function(printer) {
			var config = qz.configs.create(printer);
			var dataArr = [zplBinary] ;
			qz.print(config, dataArr);
		});
	},
	doQzClose: function() {
		if( typeof qz == 'undefined' ) {
			reject("Qz disabled") ;
		}
		qz.websocket.disconnect() ;
	}
});
