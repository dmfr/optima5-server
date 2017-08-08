Ext.define('Optima5.Modules.Spec.DbsTracy.OrderFileAdrPanel',{
	extend:'Ext.panel.Panel',
	
	_readonlyMode: false,
	
	initComponent: function() {
		Ext.apply(this,{
			title: 'Address details',
			layout: 'fit',
			tbar:[{
				itemId: 'tbSave',
				iconCls:'op5-sdomains-menu-submit',
				text:'Save',
				handler: function() {
					this.handleSaveHeader() ;
				},
				scope:this
			}],
			items:[{
				xtype: 'component',
				cls:'op5-waiting'
			}]
		}) ;
		
		this.callParent() ;
		if( this._readonlyMode ) {
			this.down('toolbar').setVisible(false) ;
		}
		
		this.on('afterrender', function() {
			if( true || (this._idSoc && this._adrJson) ) {
				this.setupAdr(this._idSoc,this._adrJson) ;
			}
		},this) ;
	},
	
	showLoadmask: function() {
		if( this.rendered ) {
			this.doShowLoadmask() ;
		} else {
			this.on('afterrender',this.doShowLoadmask,this,{single:true}) ;
		}
	},
	doShowLoadmask: function() {
		if( this.loadMask ) {
			return ;
		}
		this.loadMask = Ext.create('Ext.LoadMask',{
			target: this,
			msg:"Please wait..."
		}).show();
	},
	hideLoadmask: function() {
		this.un('afterrender',this.doShowLoadmask,this) ;
		if( this.loadMask ) {
			this.loadMask.destroy() ;
			this.loadMask = null ;
		}
	},
	
	setupAdr: function(idSoc,adrJson) {
		this._idSoc = idSoc ;
		this._adrJson = adrJson ;
		
		var adrMap = (Ext.isObject(Ext.JSON.decode(adrJson)) ? Ext.JSON.decode(adrJson) : {} ),
			data = [] ;
		if( !Optima5.Modules.Spec.DbsTracy.HelperCache.getSoc(idSoc) ) {
			return ;
		}
		Ext.Array.each( Optima5.Modules.Spec.DbsTracy.HelperCache.getSoc(idSoc).cfg_adr, function(adrField) {
			data.push({
				adr_key: adrField,
				adr_value: (adrMap[adrField] || '')
			}) ;
		}) ;
		
		this.removeAll() ;
		this.add({
			xtype: 'grid',
			store: {
				fields: [
					{ name: 'adr_key', type: 'string' },
					{ name: 'adr_value', type: 'string' }
				],
				data: data
			},
			columns: [{
				text: 'Field',
				dataIndex: 'adr_key',
				width: 100,
				renderer: function(v) {
					return '<b>'+v+'</b>' ;
				}
			},{
				text: 'Value',
				dataIndex: 'adr_value',
				flex: 1,
				editor: {xtype: 'textfield'}
			}],
			plugins: ( Optima5.Modules.Spec.DbsTracy.HelperCache.authHelperQueryPage('ADMIN') && !this._readonlyMode ? [{
				ptype: 'rowediting',
				clicksToEdit: 1
			}] : [])
		});
	},
	
	handleSaveHeader: function(validateStepCode, noConfirm) {
		var adrObj = {} ;
		this.down('grid').getStore().each( function(rec) {
			adrObj[rec.get('adr_key')] = rec.get('adr_value') ;
		});
		this.fireEvent('saved',this,Ext.JSON.encode(adrObj)) ;
		this.destroy() ;
	}
});
