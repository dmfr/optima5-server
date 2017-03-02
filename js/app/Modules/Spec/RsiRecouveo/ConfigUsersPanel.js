Ext.define('Optima5.Modules.Spec.RsiRecouveo.ConfigUsersPanel', {
	extend: 'Ext.panel.Panel',
	
	initComponent: function() {
		var atrRenderer = function(value, metaData, record, rowIndex, colIndex, store, view) {
			return value.join(',') ;
		}
		var atrColumns = [], atrFields = [] ;
		Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getAllAtrIds(), function(atrId) {
			var atrRecord = Optima5.Modules.Spec.RsiRecouveo.HelperCache.getAtrHeader(atrId) ;
			//console.dir(atrRecord) ;
			atrColumns.push({
				text: atrRecord.atr_txt,
				dataIndex: 'link_'+atrRecord.bible_code,
				width:90,
				align: 'center'
			}) ;
			atrFields.push({
				xtype: 'op5crmbasebibletreepicker',
				optimaModule: this.optimaModule,
				bibleId: atrRecord.bible_code,
				name: 'link_'+atrRecord.bible_code,
				fieldLabel: atrRecord.atr_txt
			}) ;
		},this) ;
		
		Ext.apply(this,{
			layout: 'border',
			items:[{
				region: 'center',
				flex: 1,
				xtype: 'gridpanel',
				columns: [{
					dataIndex: 'user_id',
					text: 'ID',
					renderer: function(v) {
						return '<b>'+v+'</b>' ;
					}
				},{
					width: 160,
					dataIndex: 'user_fullname',
					text: 'ID'
				},{
					width: 160,
					dataIndex: 'user_email',
					text: 'Email'
				},{
					width: 90,
					dataIndex: 'user_tel',
					text: 'Téléphone'
				},{
					text: 'Attributs',
					columns: atrColumns
				}],
				store: {
					autoLoad: true,
					model: Optima5.Modules.Spec.RsiRecouveo.HelperCache.getConfigUserModel(),
					proxy: this.optimaModule.getConfiguredAjaxProxy({
						extraParams : {
							_moduleId: 'spec_rsi_recouveo',
							_action: 'config_loadUser'
						},
						reader: {
							type: 'json',
							rootProperty: 'data'
						}
					})
				},
				listeners: {
					itemclick: function(grid,record) {
						this.setFormRecord( record ) ;
					},
					scope: this
				}
			},{
				region: 'east',
				itemId: 'cntEast',
				flex: 1,
				collapsible: true,
				collapsed: true,
				_empty:true,
				listeners:{
					beforeexpand:function(eastpanel) {
						if( eastpanel._empty ) {
							return false;
						}
					},
					scope:this
				},
				xtype: 'form',
				cls: 'ux-noframe-bg',
				layout: 'anchor',
				bodyPadding: 10,
				bodyCls: 'ux-noframe-bg',
				fieldDefaults: {
					labelWidth: 90,
					anchor: '100%'
				},
				items: Ext.Array.merge([{
					xtype: 'textfield',
					name: 'user_id',
					fieldLabel: 'ID utilisateur',
					anchor: '60%'
				},{
					xtype: 'textfield',
					name: 'user_pw',
					fieldLabel: 'Password',
					anchor: '60%'
				},{
					xtype: 'textfield',
					name: 'user_fullname',
					fieldLabel: 'Nom complet'
				},{
					xtype: 'textfield',
					name: 'user_email',
					fieldLabel: 'Email'
				},{
					xtype: 'textfield',
					name: 'user_tel',
					fieldLabel: 'Téléphone'
				}],atrFields),
				buttons: [{
					itemId: 'btnOk',
					xtype: 'button',
					text: 'OK',
					icon: 'images/op5img/ico_save_16.gif',
					handler: function( btn ) {
						this.handleSave() ;
					},
					scope: this
				},{
					itemId: 'btnCancel',
					xtype: 'button',
					text: 'Abandon',
					icon: 'images/op5img/ico_cancel_small.gif',
					handler: function( btn ) {
						this.destroy() ;
					},
					scope: this
				}]
			}]
		}) ;
		this.callParent() ;
	},
	
	
	setFormRecord: function(userRecord) {
		var me = this,
			eastpanel = me.down('#cntEast') ;
		if( userRecord == null ) {
			eastpanel._empty = true ;
			eastpanel.collapse() ;
			eastpanel.reset() ;
			return ;
		}
		
		var title ;
		if( userRecord.get('_is_new') ) {
			title = 'Création utilisateur' ;
		} else {
			title = 'Modification: '+userRecord.getId ;
		}
		
		
		eastpanel._empty = false ;
		eastpanel.setTitle(title) ;
		console.dir(userRecord.getData()) ;
		eastpanel.getForm().setValues( userRecord.getData() ) ;
		eastpanel.expand() ;
	},
	closeForm: function() {
		var me = this,
			eastpanel = me.down('#cntEast') ;
		eastpanel._empty = true ;
		eastpanel.collapse() ;
		eastpanel.reset() ;
	}
}); 
