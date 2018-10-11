Ext.define('Optima5.Modules.Spec.DbsLam.CfgParamButton' ,{
	extend: 'Ext.button.Button',
	
	requires: ['Optima5.Modules.Spec.DbsLam.CfgParamTree'],
	
	initComponent: function() {
		Ext.apply(this,{
			menu: {
				xtype:'menu',
				items:[Ext.create('Optima5.Modules.Spec.DbsLam.CfgParamTree',{
					optimaModule: this.optimaModule,
					cfgParam_id: this.cfgParam_id,
					width:250,
					height:300,
					listeners: {
						change: {
							fn: function(){
								this.onChange() ;
							},
							scope: this
						},
						load: {
							fn: this.onAfterLoad,
							scope: this
						}
					},
					value: this.value
				})]
			}
		});
		
		this.baseText = this.text ;
		
		this.callParent() ;
		this.onChange(true) ;
		this.menu.on('beforeshow',this.onMenuBeforeShow,this) ;
	},
	onMenuBeforeShow: function() {
		if( this.btnReadOnly ) {
			return false ;
		}
	},
	onChange: function(silent) {
		var cfgParamTree = this.menu.down('treepanel'),
			selectedValue = cfgParamTree.getValue() ;
		if( selectedValue == null ) {
			this.removeCls( 'op5-spec-dbspeople-cfgparambtn-bold' ) ;
			this.setText( this.baseText ) ;
		} else {
			this.addCls( 'op5-spec-dbspeople-cfgparambtn-bold' ) ;
			if( cfgParamTree.getStore().getNodeById(selectedValue) == null ) {
				this.setText( '' ) ;
			} else {
				this.setText( cfgParamTree.getStore().getNodeById(selectedValue).get('nodeText') ) ;
			}
		}
		
		if( !silent ) {
			this.fireEvent('change',selectedValue) ;
		}
	},
	getValue: function() {
		var cfgParamTree = this.menu.down('treepanel'),
			selectedValue = cfgParamTree.getValue() ;
		return selectedValue ;
	},
	getNode: function() {
		var cfgParamTree = this.menu.down('treepanel'),
			selectedValue = cfgParamTree.getNode() ;
		return selectedValue ;
	},
	getLeafNodesKey: function() {
		var cfgParamTree = this.menu.down('treepanel'),
			retValue = cfgParamTree.getLeafNodesKey() ;
		return retValue ;
	},
	
	setValue: function(val) {
		var cfgParamTree = this.menu.down('treepanel') ;
		cfgParamTree.setValue(val) ;
		cfgParamTree.setVisible((val==null)) ;
	},
	
	onAfterLoad: function() {
		if( !Optima5.Modules.Spec.DbsLam.HelperCache.authHelperHasAll() && !this.noAuthCheck ) {
			this.doAuthCleanup() ;
		}
		this.fireEvent('ready',this) ;
	},
	doAuthCleanup: function() {}
}) ;
