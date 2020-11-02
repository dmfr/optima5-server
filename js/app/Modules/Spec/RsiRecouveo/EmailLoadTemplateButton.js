Ext.define('Optima5.Modules.Spec.RsiRecouveo.EmailLoadTemplateButton',{
	extend:'Ext.button.Button',
	
	panelWidth: 300,
	panelHeight: 300,
	
	initComponent: function() {
		Ext.apply(this,{
			scale: 'medium',
			icon: 'images/modules/rsiveo-save-22.png',
			text: '&#160;',
			listeners: {
				click: function() {
					this.toggleWindow() ;
				},
				scope: this
			}
		}) ;
		
		this.attachmentsStore = Ext.create('Ext.data.Store', {
			model: 'RsiRecouveoCfgTemplateModel',
			data: Optima5.Modules.Spec.RsiRecouveo.HelperCache.getTemplateAll(),
			filters: [{
				property: 'tpl_name',
				operator: '!=',
				value: ''
			}],
			proxy: {
				type: 'memory',
				reader: {
					type: 'json'
				}
			}
		});
		this.attachmentsStore.on('datachanged', function(store) {
			var storeCount = store.getCount() ;
			this.updateBtnText() ;
		},this) ;
		
		this.callParent() ;
		this.updateBtnText() ;
		this.on('destroy',this.onDestroyMyself,this) ;
	},
	updateBtnText: function() {
		this.setText('') ;
	},
	toggleWindow: function() {
		if( !this.floatingWindow ) {
			this.floatingWindow = this.getWindowObject() ;
		}
		if( !this.floatingWindow.isVisible() ) {
			this.floatingWindow.showBy(this.el, 'tr-br?') ;
		} else {
			this.floatingWindow.hide() ;
		}
	},
	getWindowObject: function() {
		var me = this ;
		return Ext.create('Ext.window.Window',{
			width: this.panelWidth,
			height: this.panelHeight,
			
			closeAction: 'hide',
			header: false,
			hidden: true,
			renderTo: this.renderTarget,
			constrain: true,
			layout: {
				type: 'vbox',
				align: 'stretch'
			},
			items: [{
				xtype: 'form',
				cls: 'ux-noframe-bg',
				bodyCls: 'ux-noframe-bg',
				bodyPadding: 2,
				defaults: {
						anchor: '100%',
						allowBlank: false,
						msgTarget: 'side',
						labelWidth: 50
				},
				//bodyPadding: '0 0 0 0',
				items: [{
					xtype: 'filefield',
					emptyText: 'Selectionner fichier',
					name: 'uploadfile',
					buttonText: '',
					buttonConfig: {
						iconCls: 'upload-icon'
					},
					listeners: {
						change: {
							fn: function(field) {
								var form = field.up('form') ;
								this.doUploadManual(form) ;
							},
							scope:this
						}
					}
				}]
			},{
				flex: 1,
				xtype: 'grid',
				columns: [{
					align: 'center',
					xtype:'actioncolumn',
					width:24,
					disabledCls: 'x-item-invisible',
					items: [{
						icon: 'images/op5img/ico_edit_small.gif',
						tooltip: 'Sélectionner',
						handler: function(grid, rowIndex, colIndex, item, e) {
							var rec = grid.getStore().getAt(rowIndex);
							this.handleSelectTpl( rec.get('tpl_id') ) ;
						},
						scope: this
					}]
				},{
					header: 'Name',
					dataIndex: 'tpl_name',
					flex: 1
				}],
				viewConfig: {
					emptyText: 'No templates available',
					deferEmptyText: false
				},
				store: this.attachmentsStore,
			}] 
		});
	},
	handleSelectTpl: function(tplId) {
		console.log('Loading tpl = '+tplId) ;
	},
	onDestroyMyself: function(myself) {
		if( this.floatingWindow ) {
			this.floatingWindow.destroy() ;
		}
	}
});
