Ext.define('OptimaIconModel', {
	extend: 'Ext.data.Model',
	idProperty: 'iconCode',
	fields: [
		{name: 'iconCode', type: 'string'},
		{name: 'iconSrc16', type: 'string'},
		{name: 'iconSrc48', type: 'string'}
	]
});
 
Ext.define('Optima5.Icons',{
	mixins: {
		observable: 'Ext.util.Observable'
	},
	requires:[
		'Ext.data.Store',
		'Ext.util.CSS'
	],
	
	iconsStore: null,
	
	constructor: function(config) {
		//build store
		var me = this ;
		
		me.addEvents('ready') ;
		me.mixins.observable.constructor.call(this, config);
		
		me.iconsStore = Ext.create('Ext.data.Store',{
			model:'OptimaIconModel',
			proxy: {
				type: 'ajax',
				url : './js/app/Icons.json',
				reader: {
					type: 'json'
				}
			},
			autoLoad: false
		}) ;
		
		me.iconsStore.on('load',function() {
			me.buildCss() ;
			me.fireEvent('ready') ;
		},me) ;
		
		me.iconsStore.load() ;
	},
	buildCss: function() {
		var me = this ;
		
		Ext.util.CSS.removeStyleSheet('op5icons');
		
		var cssBlob = '' ;
		Ext.Array.each( me.iconsStore.getRange(),function(record){
			cssBlob += ".op5icon-"+record.get('iconCode')+"-small { background-image: url(images/icons/"+record.get('iconSrc16')+"); }\r\n" ;
			cssBlob += ".op5icon-"+record.get('iconCode')+"-big   { background-image: url(images/icons/"+record.get('iconSrc48')+"); }\r\n" ;
		},me) ;
		Ext.util.CSS.createStyleSheet(cssBlob, 'op5icons');
	},
	iconsGetAll: function() {
		var me = this ;
		return me.iconsStore.getRange() ;
	},
	iconGetCls16: function(iconCode) {
		return "op5icon-"+iconCode+"-small" ;
	},
	iconGetCls48: function(iconCode) {
		return "op5icon-"+iconCode+"-big" ;
	}
	
});