Ext.define('Optima5.Modules.Spec.RsiRecouveo.RecordTempPanel',{
	extend:'Ext.panel.Panel',
	
	requires: [],
	
	_fileRecord: null,
	
	initComponent: function() {
		Ext.apply(this,{
			tbar:[{
				hidden: this._readonlyMode,
				icon: 'images/op5img/ico_back_16.gif',
				text: '<u>Back</u>',
				handler: function(){
					this.doQuit() ;
				},
				scope: this
			}]
		}) ;
		this.callParent() ;
	},
	doQuit: function() {
		this.destroy() ;
	}
}) ;
