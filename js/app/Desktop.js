Ext.define('Optima5.Desktop',{
	extend:'Ext.ux.desktop.Desktop',
	
	/**
	* @cfg {Array|Store} shortcuts
	* The items to add to the DataView. This can be a {@link Ext.data.Store Store} or a
	* simple array. Items should minimally provide the fields in the
	* {@link OptimaDesktopShortcutModel ShortcutModel}.
	*/
	shortcuts: null,
	
	onShortcutItemClick: function (dataView, record) {
		var me = this ;
		//console.log(record) ;
		me.app.onModuleItemClick(record.data.execRecord) ;
	}
});