Ext.define('Optima5.Desktop',{
	extend:'Ext.ux.desktop.Desktop',
	onShortcutItemClick: function (dataView, record) {
		var me = this ;
		//console.log(record) ;
		me.app.onModuleItemClick(record.data.execRecord) ;
	}
});